// Runs automatically when Netlify receives a form entry it has checked for spam.
// New comments are added to comments.json with approved: false.
// Admins approve them in the admin page (Comments), and only approved comments are shown on the site.
// Needs the COMMENTS_GITHUB_TOKEN environment variable in Netlify (a GitHub key with Contents: Read and write on this repository).
const REPO = "Raavanaapost/Charity-site";
const FILE = "comments.json";
const BRANCH = "main";

export const handler = async (event) => {
  let payload;
  try { ({ payload } = JSON.parse(event.body || "{}")); } catch { return { statusCode: 200 }; }
  if (!payload || payload.form_name !== "comments") return { statusCode: 200 };

  const token = process.env.COMMENTS_GITHUB_TOKEN;
  if (!token) { console.log("COMMENTS_GITHUB_TOKEN is not set; comment kept only in Netlify Forms."); return { statusCode: 200 }; }

  const d = payload.data || {};
  const comment = String(d.comment || "").trim().slice(0, 2000);
  const project = String(d.project || "").trim().slice(0, 120);
  const name = String(d.name || "").trim().slice(0, 80) || "Anonymous";
  if (!comment || !project) return { statusCode: 200 };

  const entry = {
    id: String(payload.id || Date.now()),
    project, name, comment,
    date: String(payload.created_at || new Date().toISOString()).slice(0, 10),
    approved: false
  };

  const api = `https://api.github.com/repos/${REPO}/contents/${FILE}`;
  const headers = { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "User-Agent": "raavanaa-comments" };

  for (let attempt = 0; attempt < 3; attempt++) {
    const r = await fetch(`${api}?ref=${BRANCH}`, { headers });
    let sha, data = { comments: [] };
    if (r.ok) {
      const file = await r.json();
      sha = file.sha;
      try { data = JSON.parse(Buffer.from(file.content, "base64").toString("utf8")); } catch { }
      if (!Array.isArray(data.comments)) data.comments = [];
    } else if (r.status !== 404) {
      console.log("Could not read comments.json:", r.status); return { statusCode: 200 };
    }
    if (data.comments.some(c => c.id === entry.id)) return { statusCode: 200 };
    data.comments.push(entry);

    const put = await fetch(api, {
      method: "PUT", headers,
      body: JSON.stringify({
        message: `New comment on ${project} awaiting approval`,
        content: Buffer.from(JSON.stringify(data, null, 2) + "\n").toString("base64"),
        branch: BRANCH, ...(sha ? { sha } : {})
      })
    });
    if (put.ok) return { statusCode: 200 };
    if (put.status !== 409 && put.status !== 422) { console.log("Could not save comment:", put.status, await put.text()); return { statusCode: 200 }; }
  }
  return { statusCode: 200 };
};
