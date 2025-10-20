import { initWithSearchParams } from "./liff.js";

const loadingDiv = document.getElementById("loading");
// Updated element IDs to match the new HTML structure
const videoContainer = document.getElementById("video-list-container");
const videoList = document.getElementById("video-list");

let lineIdToken = null;

async function renderVideos(userId) {
  const currentUser = (
    await fetch(`/api/user/${userId}`).then((res) => res.json())
  ).data;

  if (!currentUser) {
    videoContainer.innerHTML = `<div class="card-body"><div class="alert alert-warning mb-0" role="alert">找不到使用者 ${userId} 的帳號資訊。</div></div>`;
    return;
  }

  const isPrivilegedUser = currentUser.plan === "premium";

  const videosByGroup = await fetch("/api/video/list-available", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${currentUser.token}`,
    },
    body: JSON.stringify({
      plan: currentUser.plan,
      completedVideos: currentUser.completedVideos,
    }),
  }).then((res) => res.json());

  // Names of completed videos (those with submittedAt)
  const completedNames = new Set(
    (currentUser.completedVideos ?? [])
      .filter(
        (v) =>
          Array.isArray(v?.submittedRecords) && v.submittedRecords.length > 0
      )
      .map((v) => v.name)
  );

  // Clear previous items and mount an accordion container
  const host =
    (typeof videoList !== "undefined" && videoList) ||
    document.getElementById("videoList") ||
    (typeof videoContainer !== "undefined" && videoContainer);

  if (!host) {
    console.warn("No host container found for video list.");
    return;
  }
  host.innerHTML = ""; // wipe previous

  const accordion = document.createElement("div");
  accordion.id = "videoAccordion";
  accordion.className = "accordion";
  host.appendChild(accordion);

  // Render grouped sections as accordion items (default open)
  Object.entries(videosByGroup).forEach(([groupKey, group]) => {
    const headingId = `accordion-heading-${groupKey}`;
    const collapseId = `accordion-collapse-${groupKey}`;

    // Accordion item (remove border, add spacing & shadow)
    const accItem = document.createElement("div");
    accItem.className = "accordion-item border-0 mb-3 shadow-sm";

    // Header
    const h2 = document.createElement("h2");
    h2.className = "accordion-header";
    h2.id = headingId;

    const btn = document.createElement("button");
    // default open: not collapsed + target has 'show'
    btn.className = "accordion-button";
    btn.type = "button";
    btn.setAttribute("data-bs-toggle", "collapse");
    btn.setAttribute("data-bs-target", `#${collapseId}`);
    btn.setAttribute("aria-expanded", "true");
    btn.setAttribute("aria-controls", collapseId);
    btn.textContent = group.title || `Group ${groupKey}`;

    h2.appendChild(btn);

    // Collapse body (default open -> add 'show')
    const collapse = document.createElement("div");
    collapse.id = collapseId;
    collapse.className = "accordion-collapse collapse show"; // default open
    collapse.setAttribute("aria-labelledby", headingId);
    collapse.setAttribute("data-bs-parent", "#videoAccordion");

    const body = document.createElement("div");
    body.className = "accordion-body p-0";

    // Use a list-group for the items
    const ul = document.createElement("ul");
    ul.className = "list-group list-group-flush";

    const items = group.data || [];

    // Find the first uncompleted chapter in this group
    const firstUncompleted = items.find(
      (it) => !completedNames.has(it.key)
    )?.key;

    items.forEach((item) => {
      const chapterKey = item.key; // e.g., "chapter_1_1"
      const chapterTitle = item.data?.title ?? chapterKey;
      const isCompleted = completedNames.has(chapterKey);

      // Allow only completed OR the first uncompleted
      const isAllowed =
        isPrivilegedUser || isCompleted || chapterKey === firstUncompleted;

      const li = document.createElement("li");
      li.className = `list-group-item d-flex justify-content-between align-items-center ${
        isCompleted ? "list-group-item-light text-muted" : ""
      }`;

      // Link (allowed) or plain text (locked)
      let left;
      if (isAllowed) {
        const link = document.createElement("a");
        // ✅ href uses the key (chapter_1_1)
        link.href = `/video.html?userId=${encodeURIComponent(
          userId
        )}&name=${encodeURIComponent(chapterKey)}`;
        link.textContent = chapterTitle;
        link.className = "text-decoration-none";
        if (isCompleted) {
          link.style.textDecoration = "line-through";
          link.classList.add("text-muted");
        } else {
          link.classList.add("text-dark");
        }
        left = link;
      } else {
        const span = document.createElement("span");
        span.textContent = chapterTitle;
        span.className = "text-muted";
        span.style.opacity = "0.6";
        span.setAttribute("aria-disabled", "true");
        left = span;
      }

      const statusIcon = document.createElement("i");
      statusIcon.className = isCompleted
        ? "bi bi-check-circle-fill text-success fs-5"
        : isAllowed
        ? "bi bi-play-circle fs-5 text-primary"
        : "bi bi-lock-fill text-secondary fs-6";

      li.appendChild(left);
      li.appendChild(statusIcon);
      ul.appendChild(li);
    });

    body.appendChild(ul);
    collapse.appendChild(body);
    accItem.appendChild(h2);
    accItem.appendChild(collapse);
    accordion.appendChild(accItem);
  });
}

// LIFF init and prefill
(async function () {
  let userId;
  const initError = await initWithSearchParams((urlParams) => {
    userId = urlParams.get("userId");
  });
  if (initError) {
    loadingDiv.innerHTML = `<div class='text-danger'>LIFF 初始化失敗 - ${initError}</div>`;
    return;
  }
  if (!userId) {
    lineIdToken = liff.getDecodedIDToken();
    userId = lineIdToken?.sub || "";
  }

  if (!userId) {
    loadingDiv.innerHTML = `<div class='text-danger'>無法取得使用者 ID。</div>`;
    return;
  }

  // Hide loading spinner and show the main video container
  loadingDiv.classList.add("d-none");
  videoContainer.classList.remove("d-none");
  renderVideos(userId);
})();
