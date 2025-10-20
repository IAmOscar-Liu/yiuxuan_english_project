import { initWithSearchParams } from "./liff.js";
import { formatFirebaseTime } from "./utils.js";

const loadingDiv = document.getElementById("loading");
const detailsDiv = document.getElementById("task-details");
const formTitle = document.getElementById("form-title");

async function getUserDetail(userId) {
  if (!userId) {
    return null;
  }
  const currentUser = (
    await fetch(`/api/user/${userId}`).then((res) => res.json())
  ).data;
  return currentUser;
}

async function getCoursesByCourseKey(userDetail, courseKey) {
  if (!userDetail || !courseKey) return null;
  const courseList = (
    await fetch(
      `/api/chat/list-by-courseKey?userId=${encodeURIComponent(
        userDetail.id
      )}&courseKey=${encodeURIComponent(courseKey)}`,
      {
        headers: {
          authorization: `Bearer ${userDetail.token}`,
        },
      }
    ).then((res) => res.json())
  ).data;
  return courseList;
}

/**
 * Renders the course details on the page, including a selector for different attempts.
 * @param {Array<object>} courseList An array of chat detail documents from Firestore, sorted by date.
 * @param {object} userDetail The user detail document from Firestore.
 */
function renderCourseDetails(courseList, userDetail) {
  const userName = userDetail.name;

  // Create and render the course attempt selector
  const selectorHtml = `
    <div class="mb-4">
      <label for="course-attempt-select" class="form-label">選擇查看的紀錄:</label>
      <select class="form-select" id="course-attempt-select">
        ${courseList
          .map((course, index) => {
            const attemptText =
              index === 0
                ? `最近一次 (${formatFirebaseTime(course.updatedAt)})`
                : formatFirebaseTime(course.updatedAt);
            return `<option value="${index}">${attemptText}</option>`;
          })
          .join("")}
      </select>
    </div>
  `;

  // A container for the dynamic details content
  const contentContainer = document.createElement("div");
  contentContainer.id = "course-content-container";

  detailsDiv.innerHTML = selectorHtml;
  detailsDiv.appendChild(contentContainer);

  const selector = document.getElementById("course-attempt-select");

  // Function to render the details of a single selected course attempt
  function renderSingleCourseAttempt(chatDetail) {
    const report = chatDetail.report;

    function getStarRating(score) {
      const roundedScore = Math.round(score);
      let stars = "";
      for (let i = 0; i < 5; i++) {
        stars += i < roundedScore ? "★" : "☆";
      }
      return `<div>
        <span style="color: #ffc107;">${stars}</span>
        <span style="color:#ababab; margin-left: 12px">${Number(score).toFixed(
          1
        )}</span>
      </div>`;
    }

    let reportHtml = "";
    if (report) {
      const formattedUpdatedAt = formatFirebaseTime(chatDetail.updatedAt);
      const starRatingHtml =
        report.score !== undefined && report.score !== null
          ? getStarRating(report.score)
          : "無";

      reportHtml = `
        <div class="card shadow-sm mb-4">
          <div class="card-body">
            <h5 class="card-title text-primary mb-3">學習成果</h5>
            <ul class="list-group list-group-flush">
              <li class="list-group-item d-flex justify-content-between align-items-center">
                <strong>用戶名:</strong> <span>${userName}</span>
              </li>
              <li class="list-group-item d-flex justify-content-between align-items-center">
                <strong>完成時間:</strong> <span>${formattedUpdatedAt}</span>
              </li>
              <li class="list-group-item d-flex justify-content-between align-items-center">
                <strong>學習主題:</strong> <span>${report.topic || "無"}</span>
              </li>
              <li class="list-group-item">
                <strong>涉及知識點:</strong> <div>${
                  report.topics?.join("、") || "無"
                }</div>
              </li>
              <li class="list-group-item d-flex justify-content-between align-items-center">
                <strong>評分:</strong> <span>${starRatingHtml}</span>
              </li>
              <li class="list-group-item">
                <strong>評語:</strong> <div>${report.comment || "無"}</div>
              </li>
            </ul>
          </div>
        </div>
      `;
    }

    // Build HTML for the collapsible summary from chat-details.js
    let summaryTextHtml = "";
    if (report?.summary) {
      summaryTextHtml = `
        <div class="card shadow-sm mb-4">
          <div class="card-header" id="headingSummary">
            <h5 class="mb-0">
              <button class="btn btn-link w-100 text-start text-decoration-none d-flex justify-content-between align-items-center" data-bs-toggle="collapse" data-bs-target="#collapseSummary" aria-expanded="false" aria-controls="collapseSummary">
                成果總覽
                <span class="ms-auto" id="summary-arrow">&#9660;</span>
              </button>
            </h5>
          </div>
          <div id="collapseSummary" class="collapse" aria-labelledby="headingSummary">
            <div class="card-body">
              ${report.summary.replace(/\n/g, "<br>")}
            </div>
          </div>
        </div>
      `;
    }

    // Build the HTML for the collapsible chat messages from chat-details.js
    let chatMessagesHtml = "";
    if (chatDetail.data && Array.isArray(chatDetail.data)) {
      let messagesContent = "";
      chatDetail.data.forEach((message) => {
        const isUser = message.role === "user";
        const messageClass = isUser ? "user-message" : "assistant-message";
        messagesContent += `
            <div class="d-flex mb-3 ${
              isUser ? "justify-content-end" : "justify-content-start"
            }">
              <div class="message-box p-3 shadow-sm ${messageClass}">
                ${message.text.replace(/\n/g, "<br>")}
              </div>
            </div>
          `;
      });
      chatMessagesHtml = `
        <div class="card shadow-sm mb-4">
          <div class="card-header" id="headingChat">
            <h5 class="mb-0">
              <button class="btn btn-link w-100 text-start text-decoration-none d-flex justify-content-between align-items-center" data-bs-toggle="collapse" data-bs-target="#collapseChat" aria-expanded="false" aria-controls="collapseChat">
                任務紀錄
                <span class="ms-auto" id="chat-arrow">&#9660;</span>
              </button>
            </h5>
          </div>
          <div id="collapseChat" class="collapse" aria-labelledby="headingChat">
            <div class="card-body">
              ${messagesContent}
            </div>
          </div>
        </div>
      `;
    }

    // Combine all HTML and set it
    contentContainer.innerHTML = `
      ${reportHtml}
      ${summaryTextHtml}
      ${chatMessagesHtml}
    `;
    formTitle.innerText = `${userName} 的課程詳細`;

    // Add event listeners for the collapse arrows
    const collapseElements = [
      { id: "Summary", arrowId: "summary-arrow" },
      { id: "Chat", arrowId: "chat-arrow" },
    ];

    collapseElements.forEach(({ id, arrowId }) => {
      const collapseEl = document.getElementById(`collapse${id}`);
      const arrowEl = document.getElementById(arrowId);
      if (collapseEl && arrowEl) {
        collapseEl.addEventListener("show.bs.collapse", () => {
          arrowEl.innerHTML = "&#9650;"; // Up arrow
        });
        collapseEl.addEventListener("hide.bs.collapse", () => {
          arrowEl.innerHTML = "&#9660;"; // Down arrow
        });
      }
    });
  }

  // Add event listener to the selector
  selector.addEventListener("change", (event) => {
    const selectedIndex = event.target.value;
    const selectedCourse = courseList[selectedIndex];
    if (selectedCourse) {
      renderSingleCourseAttempt(selectedCourse);
    }
  });

  // Initial render with the most recent course
  if (courseList.length > 0) {
    renderSingleCourseAttempt(courseList[0]);
  }
}

// LIFF init and prefill
(async function () {
  let userId;
  let courseKey;
  const initError = await initWithSearchParams((urlParams) => {
    userId = urlParams.get("userId");
    courseKey = urlParams.get("key");
  });
  if (initError) {
    loadingDiv.innerHTML = `<div class='text-danger'>LIFF 初始化失敗 - ${initError}</div>`;
    return;
  }

  loadingDiv.classList.add("d-none");
  detailsDiv.classList.remove("d-none");

  if (!courseKey) {
    detailsDiv.innerHTML = `<div class="alert alert-warning" role="alert">URL中缺少 key 參數。</div>`;
    formTitle.innerText = "課程詳細";
    return;
  }

  const lineIdToken = liff.getDecodedIDToken();
  userId = lineIdToken?.sub || "";
  if (!userId) {
    detailsDiv.innerHTML = `<div class="alert alert-warning" role="alert">無法取得使用者 ID。</div>`;
    formTitle.innerText = "課程詳細";
  }

  // Get the chat detail and render it
  const userDetail = await getUserDetail(userId);
  // Check if userDetail exists
  if (!userDetail) {
    detailsDiv.innerHTML = `<div class="alert alert-warning" role="alert">找不到user ${userId} 的詳細資訊。</div>`;
    formTitle.innerText = "課程詳細";
    return;
  }
  const courseList = await getCoursesByCourseKey(userDetail, courseKey);
  // Check if chatDetail exists
  if (!courseList || courseList.length === 0) {
    detailsDiv.innerHTML = `<div class="alert alert-warning" role="alert">找不到課程 ${courseKey} 的詳細資訊。</div>`;
    formTitle.innerText = "課程詳細";
    return;
  }
  renderCourseDetails(courseList, userDetail);
})();
