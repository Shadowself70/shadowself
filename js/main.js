(function () {
  const data = window.SHADOWSELF_DATA || {};

  document.addEventListener("DOMContentLoaded", () => {
    injectAiDisclosureModal();
    renderCurrentPage();
    bindModalTriggers();
    bindAudioAutoPause();
  });

  function renderCurrentPage() {
    const page = document.body.dataset.page;

    if (page === "media") {
      renderVideos();
      renderAudio();
      return;
    }

    if (page === "games") {
      renderProjects();
      return;
    }

    if (page === "updates") {
      renderUpdates();
    }
  }

  function injectAiDisclosureModal() {
    if (!data.aiDisclosure || document.getElementById("ai-disclosure-modal")) {
      return;
    }

    const modal = buildModal({
      id: "ai-disclosure-modal",
      title: data.aiDisclosure.title,
      body: `
        <p>${escapeHtml(data.aiDisclosure.intro)}</p>
        <ul>
          ${data.aiDisclosure.bullets.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ul>
      `
    });

    document.body.append(modal);
  }

  function renderVideos() {
    const root = document.getElementById("video-grid");
    if (!root) {
      return;
    }

    const videos = data.media?.videos || [];
    root.innerHTML = videos
      .map((video) => {
        const mediaFrame = video.youtubeId
          ? `
            <div class="video-frame">
              <iframe
                src="https://www.youtube.com/embed/${encodeURIComponent(video.youtubeId)}"
                title="${escapeHtml(video.title)}"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerpolicy="strict-origin-when-cross-origin"
                allowfullscreen
              ></iframe>
            </div>
          `
          : `
            <div class="video-frame-placeholder placeholder-box">
              <span class="placeholder-kicker">YouTube Embed Placeholder</span>
              <strong>${escapeHtml(video.title)}</strong>
              <span class="placeholder-meta">Recommended asset: ${escapeHtml(video.placeholderDimensions)}</span>
            </div>
          `;

        return `
          <article class="video-card">
            ${mediaFrame}
            <div class="video-copy">
              <h3>${escapeHtml(video.title)}</h3>
              ${video.description ? `<p>${escapeHtml(video.description)}</p>` : ""}
              ${renderTags(video.tags)}
              ${video.notes ? `<p>${escapeHtml(video.notes)}</p>` : ""}
            </div>
          </article>
        `;
      })
      .join("");
  }

  function renderAudio() {
    const root = document.getElementById("audio-list");
    if (!root) {
      return;
    }

    const entries = data.media?.audio || [];
    const fragment = document.createDocumentFragment();

    root.innerHTML = entries
      .map((entry, index) => {
        const entryId = entry.id || `audio-entry-${index + 1}`;
        const modalId = `${entryId}-modal`;
        const audioShell = entry.audioSrc
          ? `
            <div class="audio-player-shell">
              <audio controls preload="none" data-audio-player>
                <source src="${escapeAttribute(entry.audioSrc)}">
                Your browser does not support the audio element.
              </audio>
            </div>
          `
          : "";
        const infoAction = entry.infoBody && entry.infoBody.length
          ? `
            <div class="audio-actions">
              <button
                class="ui-button secondary"
                type="button"
                data-open-modal="${escapeAttribute(modalId)}"
              >
                ${escapeHtml(entry.infoLabel || "Info")}
              </button>
            </div>
          `
          : "";

        if (entry.infoBody && entry.infoBody.length) {
          fragment.append(
            buildModal({
              id: modalId,
              title: entry.infoTitle || entry.title,
              body: entry.infoBody.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")
            })
          );
        }

        return `
          <article class="audio-entry">
            <div class="audio-art-placeholder placeholder-box">
              <span class="placeholder-kicker">Cover Art Placeholder</span>
              <strong>${escapeHtml(entry.title)}</strong>
              <span class="placeholder-meta">Recommended asset: ${escapeHtml(entry.coverDimensions)}</span>
            </div>
            <div class="audio-entry-copy">
              <h3>${escapeHtml(entry.title)}</h3>
              ${entry.description ? `<p>${escapeHtml(entry.description)}</p>` : ""}
              ${audioShell}
              ${renderTags(entry.tags)}
              ${infoAction}
              ${entry.notes ? `<p>${escapeHtml(entry.notes)}</p>` : ""}
            </div>
          </article>
        `;
      })
      .join("");

    document.body.append(fragment);
  }

  function renderProjects() {
    const root = document.getElementById("project-grid");
    if (!root) {
      return;
    }

    const projects = data.projects || [];
    const fragment = document.createDocumentFragment();

    root.innerHTML = projects
      .map((project) => {
        const modalId = `${project.id}-modal`;

        fragment.append(
          buildModal({
            id: modalId,
            title: project.infoTitle || project.title,
            body: project.infoBody.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")
          })
        );

        return `
          <article class="project-card">
            <div class="project-card-art placeholder-box">
              <span class="placeholder-kicker">Project Art Placeholder</span>
              <strong>${escapeHtml(project.title)}</strong>
              <span class="placeholder-meta">Recommended asset: ${escapeHtml(project.imageDimensions)}</span>
            </div>
            <div class="project-card-body">
              <h3>${escapeHtml(project.title)}</h3>
              ${project.summary ? `<p>${escapeHtml(project.summary)}</p>` : ""}
              ${renderStatuses(project.status)}
            </div>
            <div class="project-actions">
              <a class="ui-button" href="${escapeAttribute(project.launchUrl)}" target="_blank" rel="noreferrer">
                ${escapeHtml(project.launchLabel || "Launch")}
              </a>
              <button
                class="ui-button secondary"
                type="button"
                data-open-modal="${escapeAttribute(modalId)}"
              >
                ${escapeHtml(project.infoLabel || "Info")}
              </button>
            </div>
          </article>
        `;
      })
      .join("");

    document.body.append(fragment);
  }

  function renderUpdates() {
    const root = document.getElementById("updates-feed");
    if (!root) {
      return;
    }

    const posts = data.updates || [];

    if (!posts.length) {
      root.innerHTML = `
        <section class="empty-state">
          <h2>No posts yet.</h2>
          <p>The first real update will show up here with the newest post pinned to the top.</p>
          <p>When you want one added, I can append it in the data file with a timestamp and publish it.</p>
        </section>
      `;
      return;
    }

    const formatter = new Intl.DateTimeFormat("en-CA", {
      dateStyle: "long",
      timeStyle: "short",
      timeZone: "America/Toronto"
    });

    root.innerHTML = posts
      .map((post) => {
        const dateLabel = post.isoDate ? formatter.format(new Date(post.isoDate)) : post.displayDate || "";
        const body = (post.body || []).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("");

        return `
          <article class="update-post">
            <div class="post-brand" aria-hidden="true">SS</div>
            <div class="post-meta">${escapeHtml(dateLabel)}</div>
            <h2>${escapeHtml(post.title)}</h2>
            <div class="post-body">${body}</div>
          </article>
        `;
      })
      .join("");
  }

  function bindModalTriggers() {
    document.addEventListener("click", (event) => {
      const trigger = event.target.closest("[data-open-modal]");
      if (trigger) {
        openModal(trigger.getAttribute("data-open-modal"));
        return;
      }

      const closeButton = event.target.closest("[data-close-modal]");
      if (closeButton) {
        closeModal(closeButton.closest(".modal"));
        return;
      }

      const backdrop = event.target.closest(".modal-backdrop");
      if (backdrop) {
        closeModal(backdrop.parentElement);
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") {
        return;
      }

      const openModalElement = document.querySelector(".modal:not([hidden])");
      if (openModalElement) {
        closeModal(openModalElement);
      }
    });
  }

  function bindAudioAutoPause() {
    document.addEventListener(
      "play",
      (event) => {
        const currentPlayer = event.target;
        if (!(currentPlayer instanceof HTMLAudioElement) || !currentPlayer.matches("[data-audio-player]")) {
          return;
        }

        document.querySelectorAll("audio[data-audio-player]").forEach((player) => {
          if (player !== currentPlayer) {
            player.pause();
          }
        });
      },
      true
    );
  }

  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) {
      return;
    }

    modal.hidden = false;
    document.body.classList.add("modal-open");

    const closeButton = modal.querySelector("[data-close-modal]");
    if (closeButton instanceof HTMLElement) {
      closeButton.focus();
    }
  }

  function closeModal(modal) {
    if (!(modal instanceof HTMLElement)) {
      return;
    }

    modal.hidden = true;

    if (!document.querySelector(".modal:not([hidden])")) {
      document.body.classList.remove("modal-open");
    }
  }

  function buildModal({ id, title, body }) {
    const modal = document.createElement("section");
    modal.className = "modal";
    modal.id = id;
    modal.hidden = true;
    modal.setAttribute("aria-labelledby", `${id}-title`);
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");

    modal.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="modal-panel">
        <button class="modal-close" type="button" aria-label="Close dialog" data-close-modal>&times;</button>
        <h2 id="${id}-title">${escapeHtml(title)}</h2>
        ${body}
      </div>
    `;

    return modal;
  }

  function renderTags(tags) {
    if (!tags || !tags.length) {
      return "";
    }

    return `<div class="tag-list">${tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>`;
  }

  function renderStatuses(statuses) {
    if (!statuses || !statuses.length) {
      return "";
    }

    return `<div class="status-list">${statuses.map((item) => `<span class="status-pill">${escapeHtml(item)}</span>`).join("")}</div>`;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function escapeAttribute(value) {
    return escapeHtml(value);
  }
})();




