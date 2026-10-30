from datetime import timedelta
from fastapi.testclient import TestClient
from sqlalchemy import select
from database import utc_now
from extended_models import Assignment, Classroom, ClassMembership, Organization, Submission, UserRole
from completion_models import LessonRevision, SubmissionRubric
from main import app
from test_platform import signed_client
from content import LESSONS
from test_completion_features import make_run


def test_lessons_publish_immutable_versions_and_grade_the_opened_snapshot(store):
    reviewer, user_id, headers = signed_client(store, "Reviewer")
    learner, _, learner_headers = signed_client(store, "Learner")
    url = "/api/v1/admin/lessons/first-qubit"
    base = LESSONS[0]
    payload = {key: base[key] for key in ("title", "objective", "level", "minutes", "steps", "question", "choices")}
    payload["correct_choice"] = 1
    assert learner.post(url + "/revisions", json=payload, headers=learner_headers).status_code == 403
    with store() as db:
        db.add(UserRole(user_id=user_id, role="reviewer")); db.commit()
    first = reviewer.post(url + "/revisions", json=payload, headers=headers)
    assert first.status_code == 201, first.text
    revision = first.json()["id"]
    assert learner.get("/api/lessons/first-qubit").json()["content_version"] == "builtin-1"
    assert learner.get("/api/lessons/first-qubit?version=" + revision).status_code == 409
    rationale = {"rationale": "Reviewed the explanation, circuit and answer key for consistency."}
    assert reviewer.put(url + "/publish/" + revision, json=rationale, headers=headers).status_code == 200
    public = learner.get("/api/lessons/first-qubit").json()
    assert public["content_version"] == revision and "correct_choice" not in public
    second = reviewer.post(url + "/revisions", json={**payload, "question": "Choose the unchanged basis-state probability.", "correct_choice": 0}, headers=headers).json()["id"]
    assert reviewer.put(url + "/publish/" + second, json=rationale, headers=headers).status_code == 409
    assert reviewer.put(url + "/publish/" + second, json={**rationale, "expected_publication_id": revision}, headers=headers).status_code == 200
    old_answer = learner.post("/api/lessons/first-qubit/answer", json={"choice": 1, "content_version": revision}, headers=learner_headers)
    assert old_answer.json()["correct"] is True
    assert learner.post("/api/lessons/first-qubit/answer", json={"choice": 1}, headers=learner_headers).json()["correct"] is False
    assert len(learner.get("/api/lessons/first-qubit/versions").json()) == 3
    assert learner.get(url + "/revisions").status_code == 403
    with store() as db:
        assert db.get(LessonRevision, revision).content["correct_choice"] == 1


def test_structured_rubric_is_frozen_and_cannot_be_bypassed_or_cross_graded(store):
    teacher, teacher_id, teacher_headers = signed_client(store, "Teacher")
    student, student_id, student_headers = signed_client(store, "Student")
    outsider, _, outside_headers = signed_client(store, "Outside")
    with store() as db:
        org = Organization(owner_user_id=teacher_id, name="Teaching test"); db.add(org); db.flush()
        classroom = Classroom(organization_id=org.id, instructor_user_id=teacher_id, title="Science", join_code_hash="hash"); db.add(classroom); db.flush()
        db.add(ClassMembership(classroom_id=classroom.id, user_id=student_id))
        assignment = Assignment(classroom_id=classroom.id, title="Interpret results", lab_slug="double-slit", instructions="Use experimental evidence.", due_at=utc_now()+timedelta(days=1)); db.add(assignment); db.commit(); assignment_id = assignment.id
    path = f"/api/v1/faculty/assignments/{assignment_id}/rubric"
    rubric = {"criteria": [{"id": "evidence", "title": "Evidence", "description": "Uses a reproducible saved experiment.", "weight": 60, "maximum": 4}, {"id": "reasoning", "title": "Reasoning", "description": "Explains the model assumptions and result.", "weight": 40, "maximum": 4}]}
    assert student.put(path, json=rubric, headers=student_headers).status_code == 404
    assert outsider.get(path).status_code == 404
    assert teacher.put(path, json={"criteria": [rubric["criteria"][0]]}, headers=teacher_headers).status_code == 422
    assert teacher.put(path, json=rubric, headers=teacher_headers).status_code == 200
    assert student.get(path).json()["definition"] == rubric
    run = make_run(student, student_headers)
    submitted = student.post(f"/api/v1/faculty/assignments/{assignment_id}/submissions", json={"run_id": run["id"], "reflection": "I compared the interference predicted by this model with the calculated distribution."}, headers=student_headers)
    assert submitted.status_code == 200, submitted.text
    submission_id = submitted.json()["id"]
    assert teacher.put(path, json=rubric, headers=teacher_headers).status_code == 409
    grade_url = f"/api/v1/faculty/submissions/{submission_id}"
    assert teacher.put(grade_url, json={"score": 100, "feedback": "Bypass"}, headers=teacher_headers).status_code == 409
    ratings = {"ratings": {"evidence": 4, "reasoning": 2}, "feedback": "Explain the boundary assumptions more carefully."}
    assert outsider.put(grade_url + "/rubric-grade", json=ratings, headers=outside_headers).status_code == 404
    assert teacher.put(grade_url + "/rubric-grade", json={**ratings, "ratings": {"evidence": 99}}, headers=teacher_headers).status_code == 422
    result = teacher.put(grade_url + "/rubric-grade", json=ratings, headers=teacher_headers)
    assert result.status_code == 200 and result.json()["score"] == 80
    with store() as db:
        assert db.get(Submission, submission_id).score == 80
        assert db.get(SubmissionRubric, submission_id).definition_snapshot == rubric
