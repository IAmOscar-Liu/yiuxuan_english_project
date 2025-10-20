import { initWithSearchParams } from "./liff.js";

const loadingDiv = document.getElementById("loading");
// Updated element IDs to match the new HTML structure
const courseContainer = document.getElementById("course-list-container");
const courseList = document.getElementById("course-list");

let lineIdToken = null;

async function renderCourses(userId) {
  const currentUser = (
    await fetch(`/api/user/${userId}`).then((res) => res.json())
  ).data;

  if (!currentUser) {
    courseContainer.innerHTML = `<div class="card-body"><div class="alert alert-warning mb-0" role="alert">找不到使用者 ${userId} 的帳號資訊。</div></div>`;
    return;
  }

  const courseByGroup = await fetch("/api/video/list-available", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${currentUser.token}`,
    },
    body: JSON.stringify({
      all: true,
    }),
  }).then((res) => res.json());

  // Names of completed courses (those with completedRecords)
  const completedCourseKeys = new Set(
    (currentUser.completedVideos ?? [])
      .filter(
        (v) =>
          v.name &&
          Array.isArray(v.completedRecords) &&
          v.completedRecords.length > 0
      )
      .map((v) => v.name)
  );

  // Clear previous items and mount an accordion container
  const host = courseList || document.getElementById("course-list");

  if (!host) {
    console.warn("No host container found for course list.");
    return;
  }
  host.innerHTML = ""; // wipe previous

  const accordion = document.createElement("div");
  accordion.id = "courseAccordion";
  accordion.className = "accordion";
  host.appendChild(accordion);

  // Render grouped sections as accordion items
  Object.entries(courseByGroup).forEach(([groupKey, group]) => {
    const headingId = `accordion-heading-${groupKey}`;
    const collapseId = `accordion-collapse-${groupKey}`;

    const accItem = document.createElement("div");
    accItem.className = "accordion-item border-0 mb-3 shadow-sm";

    const h2 = document.createElement("h2");
    h2.className = "accordion-header";
    h2.id = headingId;

    const btn = document.createElement("button");
    btn.className = "accordion-button";
    btn.type = "button";
    btn.setAttribute("data-bs-toggle", "collapse");
    btn.setAttribute("data-bs-target", `#${collapseId}`);
    btn.setAttribute("aria-expanded", "true");
    btn.setAttribute("aria-controls", collapseId);
    btn.textContent = group.title || `Group ${groupKey}`;
    h2.appendChild(btn);

    const collapse = document.createElement("div");
    collapse.id = collapseId;
    collapse.className = "accordion-collapse collapse show";
    collapse.setAttribute("aria-labelledby", headingId);
    collapse.setAttribute("data-bs-parent", "#courseAccordion");

    const body = document.createElement("div");
    body.className = "accordion-body p-0";

    const ul = document.createElement("ul");
    ul.className = "list-group list-group-flush";

    (group.data || []).forEach((item) => {
      const courseKey = item.key;
      const courseTitle = item.data?.title ?? courseKey;
      const isCompleted = completedCourseKeys.has(courseKey);

      const li = document.createElement("li");
      li.className = `list-group-item d-flex justify-content-between align-items-center ${
        isCompleted ? "" : "list-group-item-light text-muted"
      }`;

      const content = isCompleted
        ? `<a href="/course-details.html?userId=${encodeURIComponent(
            userId
          )}&key=${encodeURIComponent(
            courseKey
          )}" class="text-decoration-none text-dark">${courseTitle}</a>`
        : `<span class="text-muted">${courseTitle}</span>`;

      li.innerHTML = `${content}<i class="bi ${
        isCompleted ? "bi-check-circle-fill text-success" : "bi-lock-fill"
      } fs-5"></i>`;
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
  courseContainer.classList.remove("d-none");
  renderCourses(userId);
})();
