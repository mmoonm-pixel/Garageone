/** Only terminal punctuation in editorial headings; never formats contact data. */
export default function AccentPeriod({ text }: { text: string }) {
  return text.endsWith('.') ? <>{text.slice(0, -1)}<span className="accent-period">.</span></> : <>{text}</>;
}
