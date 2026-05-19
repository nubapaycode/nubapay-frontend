Desactiva el modo mock y vuelve al backend Flask real.

Escribí el siguiente contenido en `.env.local` (sobreescribilo si ya existe):

```
NEXT_PUBLIC_MOCK_API=false
NEXT_PUBLIC_API_URL=http://127.0.0.1:5001
```

Luego avisá al usuario que reinicie el servidor con `npm run dev` para que Next.js tome las variables.
