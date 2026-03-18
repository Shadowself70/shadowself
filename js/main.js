(function () {
  const data = window.SHADOWSELF_DATA || {};

  document.addEventListener('DOMContentLoaded', () => {
    renderCurrentPage();
    bindModalTriggers();
    bindAudioAutoPause();
  });

  function renderCurrentPage() {
    const page = document.body.dataset.page;

    if (page === 'audio') {
      renderAudio();
      return;
    }

    if (page === 'video') {
      renderVideos();
      return;
    }

    if (page === 'games') {
      renderProjects();
      return;
    }

    if (page === 'updates') {
      renderUpdates();
    }
  }

  function renderVideos() {
    const root = document.getElementById('video-groups');
    if (!root) {
      return;
    }

    const groups = [
      {
        entries: data.video?.portrait || [],
        orientation: 'portrait',
        gridClass: 'video-grid video-grid-portrait'
      },
      {
        entries: data.video?.landscape || [],
        orientation: 'landscape',
        gridClass: 'video-grid video-grid-landscape'
      },
      {
        entries: data.video?.square || [],
        orientation: 'square',
        gridClass: 'video-grid video-grid-square'
      }
    ].filter((group) => group.entries.length);

    if (!groups.length) {
      root.innerHTML = `
        <section class='empty-state'>
          <h2>No videos yet.</h2>
          <p>Video entries will show up here once files are wired in.</p>
        </section>
      `;
      return;
    }

    root.innerHTML = groups
      .map(
        (group) => `
          <section class='video-group video-group--${group.orientation}'>
            <div class='${group.gridClass}'>
              ${group.entries.map((video) => buildVideoCard(video, group.orientation)).join('')}
            </div>
          </section>
        `
      )
      .join('');
  }

  function buildVideoCard(video, orientation) {
    const mediaFrame = video.videoSrc
      ? `
        <div class='video-frame video-frame--${orientation}'>
          <video controls preload='metadata' playsinline>
            <source src='${escapeAttribute(video.videoSrc)}'>
            Your browser does not support the video tag.
          </video>
        </div>
      `
      : `
        <div class='video-frame-placeholder video-frame--${orientation} placeholder-box'>
          <span class='placeholder-kicker'>Video Placeholder</span>
          <strong>${escapeHtml(video.title)}</strong>
          <span class='placeholder-meta'>Recommended asset: ${escapeHtml(
            video.placeholderDimensions || getVideoPlaceholderDimensions(orientation)
          )}</span>
        </div>
      `;

    return `
      <article class='video-card'>
        ${mediaFrame}
        <div class='video-copy'>
          <h3>${escapeHtml(video.title)}</h3>
          ${video.description ? `<p>${escapeHtml(video.description)}</p>` : ''}
          ${renderTags(video.tags)}
          ${video.notes ? `<p>${escapeHtml(video.notes)}</p>` : ''}
        </div>
      </article>
    `;
  }

  function getVideoPlaceholderDimensions(orientation) {
    if (orientation === 'portrait') {
      return '1080 x 1920 portrait video';
    }

    if (orientation === 'square') {
      return '1080 x 1080 square video';
    }

    return '1920 x 1080 landscape video';
  }

  function renderAudio() {
    const root = document.getElementById('audio-list');
    if (!root) {
      return;
    }

    const entries = data.audio || [];
    const fragment = document.createDocumentFragment();

    root.innerHTML = entries
      .map((entry, index) => {
        const entryId = entry.id || `audio-entry-${index + 1}`;
        const modalId = `${entryId}-modal`;
        const audioShell = entry.audioSrc
          ? `
            <div class='audio-player-shell'>
              <audio controls preload='none' data-audio-player>
                <source src='${escapeAttribute(entry.audioSrc)}'>
                Your browser does not support the audio element.
              </audio>
            </div>
          `
          : '';
        const infoAction = entry.infoBody && entry.infoBody.length
          ? `
            <div class='audio-actions'>
              <button
                class='audio-info-button'
                type='button'
                data-open-modal='${escapeAttribute(modalId)}'
              >
                ${escapeHtml(entry.infoLabel || 'Info')}
              </button>
            </div>
          `
          : '';

        if (entry.infoBody && entry.infoBody.length) {
          fragment.append(
            buildModal({
              id: modalId,
              title: entry.infoTitle || entry.title,
              body: entry.infoBody.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')
            })
          );
        }

        const coverArt = entry.coverArtSrc
          ? `
            <div class='audio-art-placeholder'>
              <img
                class='audio-cover-art'
                src='${escapeAttribute(entry.coverArtSrc)}'
                alt='${escapeAttribute(entry.title)} cover art'
                loading='lazy'
              >
            </div>
          `
          : `
            <div class='audio-art-placeholder placeholder-box'>
              <span class='placeholder-kicker'>Cover Art Placeholder</span>
              <strong>${escapeHtml(entry.title)}</strong>
              <span class='placeholder-meta'>Recommended asset: ${escapeHtml(entry.coverDimensions)}</span>
            </div>
          `;

        return `
          <article class='audio-entry'>
            ${coverArt}
            <div class='audio-entry-copy'>
              <h3>${escapeHtml(entry.title)}</h3>
              ${entry.description ? `<p>${escapeHtml(entry.description)}</p>` : ''}
              ${audioShell}
              <div class='audio-meta-row'>${infoAction}${renderTags(entry.tags)}</div>
              ${entry.notes ? `<p>${escapeHtml(entry.notes)}</p>` : ''}
            </div>
          </article>
        `;
      })
      .join('');

    document.body.append(fragment);
  }

  function renderProjects() {
    const root = document.getElementById('project-grid');
    if (!root) {
      return;
    }

    const projects = data.projects || [];
    root.innerHTML = projects
      .map((project) => {
        const detailParagraphs = (project.infoBody || [])
          .filter((paragraph) => paragraph && paragraph.trim() && paragraph.trim().toLowerCase() !== 'details to come.')
          .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
          .join('');
        const summary = project.summary ? `<p>${escapeHtml(project.summary)}</p>` : '';
        const projectTag = project.launchUrl ? 'a' : 'article';
        const hrefAttribute = project.launchUrl ? ` href='${escapeAttribute(project.launchUrl)}'` : '';
        const externalAttribute = /^https?:\/\//i.test(project.launchUrl || '') ? " target='_blank' rel='noreferrer'" : '';
        const ariaLabel = project.launchUrl ? ` aria-label='${escapeAttribute(project.launchLabel || `Open ${project.title}`)}'` : '';
        const statusMarkup = renderStatuses(project.status);

        const projectArt = project.imageSrc
          ? `
            <div class='project-card-art'>
              <img
                class='project-cover-art'
                src='${escapeAttribute(project.imageSrc)}'
                alt='${escapeAttribute(project.title)} artwork'
                loading='lazy'
              >
            </div>
          `
          : `
            <div class='project-card-art placeholder-box'>
              <span class='placeholder-kicker'>Project Art Placeholder</span>
              <strong>${escapeHtml(project.title)}</strong>
              <span class='placeholder-meta'>Recommended asset: ${escapeHtml(project.imageDimensions)}</span>
            </div>
          `;

        return `
          <${projectTag} class='project-card${project.launchUrl ? ' project-card-link' : ''}'${hrefAttribute}${externalAttribute}${ariaLabel}>
            ${projectArt}
            <div class='project-card-body'>
              <h3>${escapeHtml(project.title)}</h3>
              ${summary}
              ${detailParagraphs}
              ${statusMarkup}
            </div>
          </${projectTag}>
        `;
      })
      .join('');
  }

  function renderUpdates() {
    const root = document.getElementById('updates-feed');
    if (!root) {
      return;
    }

    const posts = data.updates || [];

    if (!posts.length) {
      root.innerHTML = `
        <section class='empty-state'>
          <h2>No posts yet.</h2>
          <p>The first real update will show up here with the newest post pinned to the top.</p>
          <p>When you want one added, I can append it in the data file with a timestamp and publish it.</p>
        </section>
      `;
      return;
    }

    const formatter = new Intl.DateTimeFormat('en-CA', {
      dateStyle: 'long',
      timeStyle: 'short',
      timeZone: 'America/Toronto'
    });

    root.innerHTML = posts
      .map((post) => {
        const dateLabel = post.isoDate ? formatter.format(new Date(post.isoDate)) : post.displayDate || '';
        const metaParts = [dateLabel];
        if (post.author) {
          metaParts.push(`By ${post.author}`);
        }
        const body = (post.body || []).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('');
        const videoEmbed = renderPostVideo(post.youtubeUrl, post.title);

        return `
          <article class='update-post'>
            <div class='post-brand' aria-hidden='true'>SS</div>
            <div class='post-meta'>${escapeHtml(metaParts.filter(Boolean).join(' | '))}</div>
            <h2>${escapeHtml(post.title)}</h2>
            <div class='post-body'>${body}${videoEmbed}</div>
          </article>
        `;
      })
      .join('');
  }

  function bindModalTriggers() {
    document.addEventListener('click', (event) => {
      const trigger = event.target.closest('[data-open-modal]');
      if (trigger) {
        openModal(trigger.getAttribute('data-open-modal'));
        return;
      }

      const closeButton = event.target.closest('[data-close-modal]');
      if (closeButton) {
        closeModal(closeButton.closest('.modal'));
        return;
      }

      const backdrop = event.target.closest('.modal-backdrop');
      if (backdrop) {
        closeModal(backdrop.parentElement);
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') {
        return;
      }

      const openModalElement = document.querySelector('.modal:not([hidden])');
      if (openModalElement) {
        closeModal(openModalElement);
      }
    });
  }

  function bindAudioAutoPause() {
    document.addEventListener(
      'play',
      (event) => {
        const currentPlayer = event.target;
        if (!(currentPlayer instanceof HTMLAudioElement) || !currentPlayer.matches('[data-audio-player]')) {
          return;
        }

        document.querySelectorAll('audio[data-audio-player]').forEach((player) => {
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
    document.body.classList.add('modal-open');

    const closeButton = modal.querySelector('[data-close-modal]');
    if (closeButton instanceof HTMLElement) {
      closeButton.focus();
    }
  }

  function closeModal(modal) {
    if (!(modal instanceof HTMLElement)) {
      return;
    }

    modal.hidden = true;

    if (!document.querySelector('.modal:not([hidden])')) {
      document.body.classList.remove('modal-open');
    }
  }

  function buildModal({ id, title, body }) {
    const modal = document.createElement('section');
    modal.className = 'modal';
    modal.id = id;
    modal.hidden = true;
    modal.setAttribute('aria-labelledby', `${id}-title`);
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');

    modal.innerHTML = `
      <div class='modal-backdrop'></div>
      <div class='modal-panel'>
        <button class='modal-close' type='button' aria-label='Close dialog' data-close-modal>&times;</button>
        <h2 id='${id}-title'>${escapeHtml(title)}</h2>
        ${body}
      </div>
    `;

    return modal;
  }

  function renderTags(tags) {
    if (!tags || !tags.length) {
      return '';
    }

    return `<div class='tag-list'>${tags.map((tag) => `<span class='tag'>${escapeHtml(tag)}</span>`).join('')}</div>`;
  }

  function renderStatuses(statuses) {
    if (!statuses || !statuses.length) {
      return '';
    }

    return `<div class='status-list'>${statuses.map((item) => `<span class='status-pill'>${escapeHtml(item)}</span>`).join('')}</div>`;
  }

  function renderPostVideo(youtubeUrl, title) {
    const youtubeId = getYouTubeId(youtubeUrl);
    if (!youtubeId) {
      return '';
    }

    return `
      <div class='video-frame update-video-frame'>
        <iframe
          src='https://www.youtube-nocookie.com/embed/${encodeURIComponent(youtubeId)}?rel=0'
          title='${escapeHtml(title)}'
          allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
          referrerpolicy='strict-origin-when-cross-origin'
          allowfullscreen
        ></iframe>
      </div>
    `;
  }

  function getYouTubeId(url) {
    if (!url) {
      return '';
    }

    try {
      const parsedUrl = new URL(url);
      const hostname = parsedUrl.hostname.toLowerCase();
      const pathParts = parsedUrl.pathname.split('/').filter(Boolean);

      if (hostname.includes('youtu.be')) {
        return pathParts[0] || '';
      }

      if (hostname.includes('youtube.com') || hostname.includes('youtube-nocookie.com')) {
        if (parsedUrl.searchParams.get('v')) {
          return parsedUrl.searchParams.get('v') || '';
        }

        if (['embed', 'shorts', 'live'].includes(pathParts[0])) {
          return pathParts[1] || '';
        }
      }
    } catch {
      return '';
    }

    return '';
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function escapeAttribute(value) {
    return escapeHtml(value);
  }
})();
