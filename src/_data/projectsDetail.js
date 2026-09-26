import projects from "./projects.json" with { type: "json" };
export default projects.filter((p) => p.detail);
