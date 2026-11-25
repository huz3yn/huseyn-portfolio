import { useEffect, useState } from 'react';

const fmt = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Asia/Baku',
});

/** Live local time in Baku, updated every 10 seconds. */
export function useBakuTime(): string {
  const [time, setTime] = useState(() => fmt.format(new Date()));
  useEffect(() => {
    const id = window.setInterval(() => setTime(fmt.format(new Date())), 10_000);
    return () => window.clearInterval(id);
  }, []);
  return time;
}
