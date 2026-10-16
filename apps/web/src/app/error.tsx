'use client';

import { Button, Typography } from '@mui/material';

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="fatal-error"><Typography variant="h2">Не удалось открыть доску</Typography><Typography color="text.secondary">Попробуйте загрузить рабочее пространство ещё раз.</Typography><Button variant="contained" onClick={reset}>Попробовать снова</Button></main>;
}
