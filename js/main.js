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

    const entries = getVideoEntries();
    if (!entries.length) {
      root.innerHTML = `
        <section class='empty-state'>
          <h2>No videos yet.</h2>
          <p>Video entries will show up here once files are wired in.</p>
        </section>
      `;
      return;
    }

    root.innerHTML = `
      <section class='video-group video-group--portrait' data-video-group='portrait' hidden>
        <div class='video-grid video-grid-portrait'></div>
      </section>
      <section class='video-group video-group--landscape' data-video-group='landscape' hidden>
        <div class='video-grid video-grid-landscape'></div>
      </section>
      <section class='video-group video-group--square' data-video-group='square' hidden>
        <div class='video-grid video-grid-square'></div>
      </section>
    `;

    entries.forEach((entry, index) => {
      const hintedOrientation = normalizeVideoOrientation(
        entry.orientationHint || deriveOrientationFromPlaceholder(entry.placeholderDimensions)
      );
      const card = buildVideoCardElement(entry, hintedOrientation, index);

      placeVideoCard(root, card, hintedOrientation);

      const video = card.querySelector('video');
      if (!video || !entry.videoSrc) {
        return;
      }

      const applyDetectedOrientation = () => {
        const detectedOrientation = classifyVideoOrientation(video.videoWidth, video.videoHeight) || hintedOrientation;
        syncVideoFrameOrientation(card, detectedOrientation);
        placeVideoCard(root, card, detectedOrientation);
      };

      if (video.readyState >= 1 && video.videoWidth && video.videoHeight) {
        applyDetectedOrientation();
        return;
      }

      video.addEventListener('loadedmetadata', applyDetectedOrientation, { once: true });
      video.addEventListener(
        'error',
        () => {
          syncVideoFrameOrientation(card, hintedOrientation);
          placeVideoCard(root, card, hintedOrientation);
        },
        { once: true }
      );
    });
  }

  function getVideoEntries() {
    if (Array.isArray(data.video?.entries)) {
      return data.video.entries;
    }

    return ['portrait', 'landscape', 'square'].flatMap((orientation) =>
      (data.video?.[orientation] || []).map((entry) => ({
        ...entry,
        orientationHint: entry.orientationHint || orientation
      }))
    );
  }

  function buildHostedVideoMarkup(videoSrc, orientation, extraClass = '') {
    const extraClasses = extraClass ? ` ${extraClass}` : '';
    return `
      <div class='video-frame video-frame--${orientation}${extraClasses}'>
        <video controls preload='metadata' playsinline>
          <source src='${escapeAttribute(videoSrc)}'>
          Your browser does not support the video tag.
        </video>
      </div>
    `;
  }

  function buildVideoCardElement(entry, orientation, index) {
    const card = document.createElement('article');
    card.className = 'video-card';
    card.dataset.entryIndex = String(index);

    const mediaFrame = entry.videoSrc
      ? buildHostedVideoMarkup(entry.videoSrc, orientation)
      : `
        <div class='video-frame-placeholder video-frame--${orientation} placeholder-box'>
          <span class='placeholder-kicker'>Video Placeholder</span>
          <strong>${escapeHtml(entry.title)}</strong>
          <span class='placeholder-meta'>Recommended asset: ${escapeHtml(
            entry.placeholderDimensions || getVideoPlaceholderDimensions(orientation)
          )}</span>
        </div>
      `;

    const launchAction = entry.launchUrl
      ? `
        <div class='video-actions'>
          <a
            class='ui-button'
            href='${escapeAttribute(entry.launchUrl)}'
            ${/^https?:\/\//i.test(entry.launchUrl) ? "target='_blank' rel='noreferrer'" : ''}
          >
            ${escapeHtml(entry.launchLabel || 'Open')}
          </a>
        </div>
      `
      : '';

    card.innerHTML = `
      ${mediaFrame}
      <div class='video-copy'>
        <h3>${escapeHtml(entry.title)}</h3>
        ${entry.description ? `<p>${escapeHtml(entry.description)}</p>` : ''}
        ${renderTags(entry.tags)}
        ${entry.notes ? `<p>${escapeHtml(entry.notes)}</p>` : ''}
        ${launchAction}
      </div>
    `;

    return card;
  }
  function placeVideoCard(root, card, orientation) {
    const normalizedOrientation = normalizeVideoOrientation(orientation);
    const targetGroup = root.querySelector(`[data-video-group='${normalizedOrientation}']`);
    if (!targetGroup) {
      return;
    }

    card.dataset.orientation = normalizedOrientation;
    targetGroup.hidden = false;

    const grid = targetGroup.querySelector('.video-grid');
    insertVideoCardInOrder(grid, card);
    updateVideoGroupVisibility(root);
  }

  function insertVideoCardInOrder(grid, card) {
    const cardIndex = Number(card.dataset.entryIndex || 0);
    const nextCard = Array.from(grid.children).find(
      (existingCard) => Number(existingCard.dataset.entryIndex || 0) > cardIndex
    );

    if (nextCard) {
      grid.insertBefore(card, nextCard);
      return;
    }

    grid.appendChild(card);
  }

  function updateVideoGroupVisibility(root) {
    root.querySelectorAll('[data-video-group]').forEach((group) => {
      const grid = group.querySelector('.video-grid');
      group.hidden = !grid || !grid.children.length;
    });
  }

  function syncVideoFrameOrientation(card, orientation) {
    const normalizedOrientation = normalizeVideoOrientation(orientation);
    const frame = card.querySelector('.video-frame, .video-frame-placeholder');
    if (!frame) {
      return;
    }

    frame.classList.remove('video-frame--portrait', 'video-frame--landscape', 'video-frame--square');
    frame.classList.add(`video-frame--${normalizedOrientation}`);
  }

  function classifyVideoOrientation(width, height) {
    if (!width || !height) {
      return '';
    }

    const ratio = width / height;
    if (Math.abs(ratio - 1) <= 0.08) {
      return 'square';
    }

    return ratio > 1 ? 'landscape' : 'portrait';
  }

  function deriveOrientationFromPlaceholder(placeholderDimensions) {
    const label = String(placeholderDimensions || '').toLowerCase();
    if (label.includes('square') || label.includes('1080 x 1080')) {
      return 'square';
    }

    if (label.includes('portrait') || label.includes('1080 x 1920')) {
      return 'portrait';
    }

    return 'landscape';
  }

  function normalizeVideoOrientation(value) {
    return ['portrait', 'landscape', 'square'].includes(value) ? value : 'landscape';
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

    const fragment = document.createDocumentFragment();
    const projects = data.projects || [];
    root.innerHTML = projects
      .map((project) => {
        const detailParagraphs = (project.infoBody || [])
          .filter((paragraph) => paragraph && paragraph.trim() && paragraph.trim().toLowerCase() !== 'details to come.')
          .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
          .join('');
        const summary = project.summary ? `<p>${escapeHtml(project.summary)}</p>` : '';
        const statusMarkup = renderStatuses(project.status);
        const launchTarget = /^https?:\/\//i.test(project.launchUrl || '') ? " target='_blank' rel='noreferrer'" : '';
        const launchHref = project.launchUrl
          ? ` href='${escapeAttribute(project.launchUrl)}'${launchTarget} aria-label='${escapeAttribute(project.launchLabel || `Open ${project.title}`)}'`
          : '';
        const promoModalId = project.promoVideoSrc ? `${project.id}-promo-modal` : '';
        const promoOrientation = normalizeVideoOrientation(project.promoVideoOrientation || 'landscape');

        if (project.promoVideoSrc) {
          fragment.append(
            buildModal({
              id: promoModalId,
              title: project.promoVideoTitle || `${project.title} video`,
              panelClass: `modal-panel--media modal-panel--${promoOrientation}`,
              body: buildHostedVideoMarkup(
                project.promoVideoSrc,
                promoOrientation,
                'project-promo-frame'
              )
            })
          );
        }

        const projectArtInner = project.imageSrc
          ? `
            <div class='project-card-art${project.imageFit === 'contain' ? ' project-card-art-contain' : ''}'>
              <img
                class='project-cover-art${project.imageFit === 'contain' ? ' project-cover-art-contain' : ''}'
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

        const projectArt = project.launchUrl
          ? `<a class='project-card-art-link'${launchHref}>${projectArtInner}</a>`
          : projectArtInner;

        const promoButton = project.promoVideoSrc
          ? `
              <button class='ui-button secondary' type='button' data-open-modal='${escapeAttribute(promoModalId)}'>
                ${escapeHtml(project.promoVideoLabel || 'Watch video')}
              </button>
            `
          : '';

        const footerActions = statusMarkup || promoButton
          ? `
            <div class='project-card-actions'>
              ${statusMarkup}
              ${promoButton}
            </div>
          `
          : '';

        return `
          <article class='project-card'>
            ${projectArt}
            <div class='project-card-body'>
              <h3>${escapeHtml(project.title)}</h3>
              ${summary}
              ${detailParagraphs}
              ${footerActions}
            </div>
          </article>
        `;
      })
      .join('');

    document.body.append(fragment);
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
            <div class='post-head'>
              <div class='post-brand' aria-hidden='true'>
                <img class='post-brand-art' src='assets/logos/shadowself-logo-small-web.png' alt=''>
              </div>
              <div class='post-meta'>${escapeHtml(metaParts.filter(Boolean).join(' | '))}</div>
            </div>
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

    modal.querySelectorAll('audio, video').forEach((media) => {
      if (!(media instanceof HTMLMediaElement)) {
        return;
      }

      media.pause();

      try {
        media.currentTime = 0;
      } catch {
        // Some streams cannot seek immediately; pausing is still enough to stop playback.
      }
    });

    modal.hidden = true;

    if (!document.querySelector('.modal:not([hidden])')) {
      document.body.classList.remove('modal-open');
    }
  }

  function buildModal({ id, title, body, panelClass = '' }) {
    const modal = document.createElement('section');
    const panelClasses = panelClass ? `modal-panel ${panelClass}` : 'modal-panel';
    modal.className = 'modal';
    modal.id = id;
    modal.hidden = true;
    modal.setAttribute('aria-labelledby', `${id}-title`);
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');

    modal.innerHTML = `
      <div class='modal-backdrop'></div>
      <div class='${panelClasses}'>
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












