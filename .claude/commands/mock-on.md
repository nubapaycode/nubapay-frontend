Activa el modo mock para desarrollo sin backend Flask.

Escribí el siguiente contenido en `.env.local` (creá el archivo si no existe, sobreescribilo si ya existe):

```
NEXT_PUBLIC_MOCK_API=true
NEXT_PUBLIC_API_URL=
```

Luego avisá al usuario que reinicie el servidor con `npm run dev` para que Next.js tome las variables.
