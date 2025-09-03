export function Demo({ input }: { input: string }) {
  console.log("Demo rendered with input:", input);
  return <div>Hello "/timetable/$timetableId/demo"! {input}</div>;
}
