# Deploy the full OpenJarvis app on Render

OpenJarvis serves the React website and its Python API from one Render web service. The existing AI, module import, and quiz flows continue to use the Python backend. The `render.yaml` Blueprint sets up the Docker build, a persistent disk, and an Ollama Cloud connection.

## Before deploying

1. Push this repository to a **private** GitHub repository. Do not commit your local `.openjarvis` directory, `.env` files, or API keys.
2. Create an Ollama Cloud API key for the existing `beam` model.
3. Generate a separate OpenJarvis API key and save it somewhere private. For example, in PowerShell:

   ```powershell
   [Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
   ```

   This is the shared key that your browser will use to access the app's protected API. Do not put it in `render.yaml` or a frontend build variable.

## Create the Render service

1. In Render, choose **New > Blueprint** and connect the GitHub repository.
2. Select the `render.yaml` at the repository root.
3. When Render asks for secrets, enter the Ollama key as `OLLAMA_API_KEY` and the separate OpenJarvis key as `OPENJARVIS_API_KEY`.
4. Review the paid Starter web service and 1 GB persistent disk before creating them. The disk keeps the SQLite databases and learning library when the service restarts or redeploys. A free web service cannot attach a persistent disk.
5. Deploy. Wait for the `/health` check to pass, then open the assigned `https://...onrender.com` URL.
6. Open the assigned site. The learning library is readable without a browser API key. To use protected features such as chat or module import, open **Settings > Connection** and paste the OpenJarvis key into **API key**. Leave **API URL** empty because the frontend and API share the same domain.

The first deploy starts with an empty learning library. Import your module text or files through the app. To transfer the existing local library and SQLite data, arrange a private migration to the mounted `/var/data/openjarvis` directory; never add these files to the public website or repository. Browser conversations and settings remain in that browser's local storage and do not move automatically.

With `OPENJARVIS_PUBLIC_MODULES=1`, anyone with the site URL can read the module list and full lesson content. The server still protects chat, imports, deletions, and other `/v1/*` and `/api/*` actions with the OpenJarvis key. Treat the key as a single-user credential. If you intend to allow other people to use protected features, add proper user accounts and per-user data isolation before sharing the URL.
