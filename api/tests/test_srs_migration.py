import importlib.util
from pathlib import Path

from alembic.migration import MigrationContext
from alembic.operations import Operations
from sqlalchemy import create_engine, inspect


def module(path):
    spec = importlib.util.spec_from_file_location("migration_under_test", path)
    target = importlib.util.module_from_spec(spec); spec.loader.exec_module(target)
    return target


def test_additive_migration_upgrade_downgrade_preserves_existing_user(tmp_path):
    initial = module(Path(__file__).parents[1] / "migrations/versions/cb150cf3a553_initial_schema.py")
    extension = module(Path(__file__).parents[1] / "migrations/versions/20261028_srs_expansion.py")
    checkout = module(Path(__file__).parents[1] / "migrations/versions/20261028_checkout_reservations.py")
    consent = module(Path(__file__).parents[1] / "migrations/versions/20261028_leaderboard_consent.py")
    completion = module(Path(__file__).parents[1] / "migrations/versions/20261030_completion.py")
    engine = create_engine(f"sqlite:///{tmp_path / 'migration.sqlite'}")
    with engine.begin() as connection:
        context = MigrationContext.configure(connection)
        with Operations.context(context):
            initial.upgrade()
            connection.exec_driver_sql("INSERT INTO users (id,display_name,email,analytics_opt_in,created_at) VALUES ('existing','Existing learner','existing@example.test',0,CURRENT_TIMESTAMP)")
            extension.upgrade()
            assert len(inspect(connection).get_table_names()) == 30
            checkout.upgrade()
            consent.upgrade()
            assert len(inspect(connection).get_table_names()) == 31
            completion.upgrade()
            assert len(inspect(connection).get_table_names()) == 38
            assert connection.exec_driver_sql("SELECT display_name FROM users WHERE id='existing'").scalar() == "Existing learner"
            completion.downgrade(); consent.downgrade(); checkout.downgrade(); extension.downgrade()
            assert len(inspect(connection).get_table_names()) == 5
            assert connection.exec_driver_sql("SELECT count(*) FROM users").scalar() == 1
    engine.dispose()
