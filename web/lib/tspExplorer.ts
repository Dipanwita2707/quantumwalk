/** Three-city TSP toy for Explorer (classical costs + 3-qubit route labels). */

export type CityId = 0 | 1 | 2;
export const CITY_NAMES = ["A", "B", "C"] as const;

/** Directed tour cost matrix (not symmetric on purpose — clearer classical spread). */
export const DISTANCE: number[][] = [
  [0, 4, 2],
  [3, 0, 1],
  [5, 2, 0],
];

const PERMUTATIONS: CityId[][] = [
  [0, 1, 2],
  [0, 2, 1],
  [1, 0, 2],
  [1, 2, 0],
  [2, 0, 1],
  [2, 1, 0],
];

export type TspRoute = {
  id: number;
  label: string;
  bits: string;
  cities: CityId[];
  cost: number;
};

function tourCost(order: CityId[]): number {
  let total = 0;
  for (let i = 0; i < order.length; i += 1) {
    const from = order[i];
    const to = order[(i + 1) % order.length];
    total += DISTANCE[from][to];
  }
  return total;
}

function routeLabel(order: CityId[]): string {
  return order.map((c) => CITY_NAMES[c]).join("→") + "→" + CITY_NAMES[order[0]];
}

export const TSP_ROUTES: TspRoute[] = PERMUTATIONS.map((cities, id) => {
  const bits = id.toString(2).padStart(3, "0");
  return { id, label: routeLabel(cities), bits, cities, cost: tourCost(cities) };
});

export function minTourCost(): number {
  return Math.min(...TSP_ROUTES.map((r) => r.cost));
}

export function optimalRoutes(): TspRoute[] {
  const min = minTourCost();
  return TSP_ROUTES.filter((r) => r.cost === min);
}

export function routesWithin(threshold: number): TspRoute[] {
  return TSP_ROUTES.filter((r) => r.cost <= threshold);
}
