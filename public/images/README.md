# Imagens do portfólio

O site carrega as imagens pelo bucket público `portfolio-media` do Supabase.
Envie os arquivos para a raiz desse bucket (não para `public/images` do GitHub).

Use estes nomes exatos para que a galeria atual os encontre automaticamente:

- `davi-franca.webp` — retrato principal
- `gallery-01.webp`
- `gallery-02.webp`
- `gallery-03.webp`
- `gallery-04.webp`
- `gallery-05.webp`
- `gallery-06.webp`
- `gallery-07.webp`
- `gallery-08.webp`

Formatos aceitos: WebP, JPEG, PNG, GIF e AVIF. Limite por arquivo: 15 MB.
Prefira WebP com aproximadamente 350–500 KB para carregamento rápido.

Para enviar: abra o painel do Supabase, entre em Storage → portfolio-media → Upload files.
O bucket é público somente para leitura; não habilitamos upload anônimo no site.
Depois de enviar, as imagens serão exibidas automaticamente sem alterar os caminhos
em `src/routes/index.tsx`.

O bucket é separado do `note-media` usado pelo Rosa Azul Caderno.
