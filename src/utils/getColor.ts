import uniqolor from 'uniqolor'

export default function getColor(subjectName: string, mode: 'light' | 'dark') {
  return uniqolor(subjectName, {
    lightness: mode === 'dark' ? 20 : 80,
    saturation: mode === 'dark' ? 60 : 70,
  }).color
}
