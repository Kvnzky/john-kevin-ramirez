/**
 * John Kevin Ramirez — Pandawa Style Interactive Architecture Scripts
 * Floating navbar scroll state, active scrollspy, category filters,
 * full-resolution lightbox modal, FAQ accordion, 1-click email copy,
 * FormSubmit status feedback, and mobile drawer navigation.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. DYNAMIC CURRENT YEAR
  const yearEl = document.getElementById('current-year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // 2. STICKY / FLOATING NAVBAR SCROLL STATE
  const navbar = document.getElementById('navbar');
  const handleScroll = () => {
    if (!navbar) return;
    if (window.scrollY > 30) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  };
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  // 3. SCROLLSPY ACTIVE NAVIGATION LINK
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-menu-link, .mobile-nav-links-pandawa a');

  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    });
  }, {
    rootMargin: '-25% 0px -65% 0px'
  });

  sections.forEach(sec => navObserver.observe(sec));

  // 4. MOBILE DRAWER MENU
  const mobileToggleBtn = document.getElementById('mobile-toggle-btn');
  const mobileOverlay = document.getElementById('mobile-overlay');
  const mobileLinks = document.querySelectorAll('.mobile-nav-links-pandawa a, .mobile-drawer-pandawa .btn-pandawa');

  if (mobileToggleBtn && mobileOverlay) {
    const toggleMobileMenu = (open) => {
      const isOpen = open !== undefined ? open : !mobileOverlay.classList.contains('open');
      mobileOverlay.classList.toggle('open', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    };

    mobileToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMobileMenu();
    });

    mobileLinks.forEach(link => {
      link.addEventListener('click', () => toggleMobileMenu(false));
    });

    document.addEventListener('click', (e) => {
      if (mobileOverlay.classList.contains('open') && !mobileOverlay.contains(e.target) && e.target !== mobileToggleBtn) {
        toggleMobileMenu(false);
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileOverlay.classList.contains('open')) {
        toggleMobileMenu(false);
      }
    });
  }

  // 5. PROJECT CATEGORY FILTERING (Automation Workflows, MedSpa & Wellness, Sports & Loyalty Funnels, Motion Funnels)
  const filterTabs = document.querySelectorAll('.filter-btn-pandawa');
  const projectCards = document.querySelectorAll('.project-card-pandawa');
  const validFilters = ['workflows', 'medspa', 'sports', 'motion'];

  // Dynamically synchronize count badges on all filter tabs
  const updateFilterCounts = () => {
    filterTabs.forEach(tab => {
      const filterKey = tab.getAttribute('data-filter');
      const count = Array.from(projectCards).filter(c => c.getAttribute('data-category') === filterKey).length;
      const baseLabel = tab.textContent.replace(/\s*\(\d+\)$/, '').trim();
      const formatted = String(count).padStart(2, '0');
      tab.textContent = `${baseLabel} (${formatted})`;
    });
  };
  updateFilterCounts();

  const applyCategoryFilter = (filterKey) => {
    const key = validFilters.includes(filterKey) ? filterKey : 'workflows';

    // 1. Update tab button state
    filterTabs.forEach(tab => {
      const tabFilter = tab.getAttribute('data-filter');
      if (tabFilter === key) {
        tab.classList.add('active');
        tab.setAttribute('aria-pressed', 'true');
      } else {
        tab.classList.remove('active');
        tab.setAttribute('aria-pressed', 'false');
      }
    });

    // 2. Filter project cards synchronously
    projectCards.forEach(card => {
      const category = card.getAttribute('data-category');
      const isMatch = (category === key);

      // Reset inline styles that might interfere with reveal classes
      card.style.display = '';
      card.style.opacity = '';
      card.style.transform = '';

      if (isMatch) {
        card.classList.remove('is-filtered-out');
        card.classList.add('is-visible');
      } else {
        card.classList.add('is-filtered-out');
      }
    });

    // 3. Persist user selection across session
    try {
      sessionStorage.setItem('portfolio_active_filter', key);
    } catch (e) {
      // Ignore if session storage is disabled
    }
  };

  filterTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const filterKey = tab.getAttribute('data-filter') || 'workflows';
      applyCategoryFilter(filterKey);
    });
  });

  // Restore active filter from session storage, defaulting to 'workflows'
  let initialFilter = 'workflows';
  try {
    const savedFilter = sessionStorage.getItem('portfolio_active_filter');
    if (savedFilter && validFilters.includes(savedFilter)) {
      initialFilter = savedFilter;
    }
  } catch (e) {
    // Ignore storage errors
  }
  applyCategoryFilter(initialFilter);

  // 6. LIGHTBOX / PROJECT DETAILS MODAL
  const modalBackdrop = document.getElementById('project-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalImg = document.getElementById('modal-img');
  const modalCategory = document.getElementById('modal-category');
  const modalTitle = document.getElementById('modal-title');
  const modalDesc = document.getElementById('modal-desc');
  const modalPlatform = document.getElementById('modal-platform');
  const modalGoal = document.getElementById('modal-goal');
  const modalTags = document.getElementById('modal-tags');
  const modalLiveAction = document.getElementById('modal-live-action');
  const modalLiveBtn = document.getElementById('modal-live-btn');

  let previousActiveEl = null;

  const openModal = (card) => {
    previousActiveEl = document.activeElement;

    const imgEl = card.querySelector('img');
    const category = card.querySelector('.project-category-tag')?.textContent || 'System Architecture';
    const title = card.querySelector('.project-title')?.textContent || 'Project Showcase';
    const desc = card.querySelector('.project-desc')?.textContent || '';
    const tags = Array.from(card.querySelectorAll('.tag-pandawa')).map(t => t.textContent);
    const platform = card.getAttribute('data-platform') || 'GoHighLevel';
    const goal = card.getAttribute('data-goal') || 'Automation & Funnel';
    const liveUrl = card.getAttribute('data-live-url');

    if (modalImg && imgEl) {
      modalImg.src = imgEl.src;
      modalImg.alt = imgEl.alt;
    }
    if (modalCategory) modalCategory.textContent = category;
    if (modalTitle) modalTitle.textContent = title;
    if (modalDesc) modalDesc.textContent = desc;
    if (modalPlatform) modalPlatform.textContent = platform;
    if (modalGoal) modalGoal.textContent = goal;

    if (modalLiveAction && modalLiveBtn) {
      if (liveUrl) {
        modalLiveBtn.href = liveUrl;
        modalLiveAction.style.display = 'block';
      } else {
        modalLiveBtn.href = '#';
        modalLiveAction.style.display = 'none';
      }
    }

    if (modalTags) {
      modalTags.innerHTML = '';
      tags.forEach(t => {
        const span = document.createElement('span');
        span.className = 'tag-pandawa';
        span.textContent = t;
        modalTags.appendChild(span);
      });
    }

    if (modalBackdrop) {
      modalBackdrop.classList.add('active');
      document.body.style.overflow = 'hidden';
      modalCloseBtn?.focus();
    }
  };

  const closeModal = () => {
    if (!modalBackdrop) return;
    modalBackdrop.classList.remove('active');
    document.body.style.overflow = '';
    if (previousActiveEl) previousActiveEl.focus();
  };

  document.querySelectorAll('.project-card-pandawa, .preview-trigger-pandawa').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      // Don't trigger if clicked on an actual outbound link inside card
      if (e.target.closest('a') && !e.target.closest('.project-action-link')) return;
      e.preventDefault();
      const card = trigger.closest('.project-card-pandawa') || trigger;
      if (card) openModal(card);
    });
  });

  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);

  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) closeModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalBackdrop?.classList.contains('active')) {
      closeModal();
    }
  });

  // 7. FAQ ACCORDION INTERACTION
  const faqRows = document.querySelectorAll('.faq-row-pandawa');
  faqRows.forEach(row => {
    const toggleBtn = row.querySelector('.faq-toggle-btn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const isActive = row.classList.contains('active');
        faqRows.forEach(other => {
          other.classList.remove('active');
          const btn = other.querySelector('.faq-toggle-btn');
          if (btn) btn.setAttribute('aria-expanded', 'false');
        });
        if (!isActive) {
          row.classList.add('active');
          toggleBtn.setAttribute('aria-expanded', 'true');
        }
      });
    }
  });

  // 8. 1-CLICK COPY EMAIL WITH TOAST
  const copyEmailBtn = document.getElementById('copy-email-btn');
  if (copyEmailBtn) {
    copyEmailBtn.addEventListener('click', async () => {
      const email = 'engrkevinramirez@gmail.com';
      try {
        await navigator.clipboard.writeText(email);
        const originalText = copyEmailBtn.innerHTML;
        copyEmailBtn.innerHTML = '<span style="color:#27C93F;">✓ Email Copied!</span>';
        setTimeout(() => {
          copyEmailBtn.innerHTML = originalText;
        }, 2200);
      } catch (err) {
        window.location.href = `mailto:${email}`;
      }
    });
  }

  // 9. BULLETPROOF CONTACT FORM DISPATCH & SUCCESS HANDLING (Guaranteed Delivery Without 522 Outages)
  const contactForm = document.getElementById('contact-form');
  const contactSuccessBox = document.getElementById('contact-success-box');
  const contactSubmit = document.getElementById('contact-submit');
  const sendWhatsappBtn = document.getElementById('send-whatsapp-btn');
  const sendEmailBtn = document.getElementById('send-email-btn');
  const copyMessageBtn = document.getElementById('copy-message-btn');
  const resetFormBtn = document.getElementById('reset-form-btn');
  const successHeading = document.getElementById('success-heading');
  const successDesc = document.getElementById('success-desc');

  if (contactForm && contactSuccessBox) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const nameInput = document.getElementById('name');
      const emailInput = document.getElementById('email');
      const companyInput = document.getElementById('company');
      const messageInput = document.getElementById('message');

      const name = nameInput ? nameInput.value.trim() : '';
      const email = emailInput ? emailInput.value.trim() : '';
      const company = companyInput ? companyInput.value.trim() : '';
      const message = messageInput ? messageInput.value.trim() : '';

      if (!name || !email || !message) {
        if (!name && nameInput) nameInput.focus();
        else if (!email && emailInput) emailInput.focus();
        else if (!message && messageInput) messageInput.focus();
        return;
      }

      // 1. Visual state
      contactSubmit.disabled = true;
      contactSubmit.innerHTML = '<span>Processing...</span>';

      // 2. Format message bodies
      const subject = `Project Inquiry from ${name}${company ? ' (' + company + ')' : ''}`;
      const emailBody = `Name: ${name}\nEmail: ${email}\nCompany: ${company || 'N/A'}\n\nProject Details:\n${message}\n\n---\nSent from JKR Systems Portfolio`;
      const waText = `Hi Kevin! My name is ${name} (${email})${company ? ' from ' + company : ''}.\n\nProject details:\n${message}`;

      const mailtoUrl = `mailto:engrkevinramirez@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
      const waUrl = `https://wa.me/639615825851?text=${encodeURIComponent(waText)}`;

      // 3. Configure direct action buttons in success state
      if (sendWhatsappBtn) sendWhatsappBtn.href = waUrl;
      if (sendEmailBtn) sendEmailBtn.href = mailtoUrl;

      if (copyMessageBtn) {
        copyMessageBtn.onclick = async () => {
          try {
            await navigator.clipboard.writeText(emailBody);
            const orig = copyMessageBtn.innerHTML;
            copyMessageBtn.innerHTML = '<span style="color:#27C93F;">✓ Message Copied!</span>';
            setTimeout(() => { copyMessageBtn.innerHTML = orig; }, 2200);
          } catch (_) {
            alert('Message copied:\n\n' + emailBody);
          }
        };
      }

      // 4. Try background AJAX without blocking or redirecting
      let apiSuccess = false;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);

        const formData = new FormData(contactForm);
        formData.append('_subject', subject);
        formData.append('_template', 'table');
        formData.append('_captcha', 'false');

        const res = await fetch('https://formsubmit.co/ajax/engrkevinramirez@gmail.com', {
          method: 'POST',
          headers: {
            'Accept': 'application/json'
          },
          body: formData,
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          const json = await res.json().catch(() => ({}));
          if (json.success === 'true' || json.success === true) {
            apiSuccess = true;
          }
        }
      } catch (_) {
        // Silently caught: service outage or timeout will seamlessly use direct dispatch
      }

      // 5. Transition to success box inside page (No external 522 error navigation)
      contactForm.style.display = 'none';
      contactSuccessBox.style.display = 'block';
      contactSuccessBox.scrollIntoView({ behavior: 'smooth', block: 'center' });

      if (apiSuccess) {
        if (successHeading) successHeading.textContent = '✓ Message Sent Successfully!';
        if (successDesc) successDesc.innerHTML = `Thank you, <strong>${name}</strong>! Your inquiry has been dispatched to <strong>engrkevinramirez@gmail.com</strong>. Need a faster answer? Connect directly on WhatsApp below:`;
      } else {
        if (successHeading) successHeading.textContent = 'Message Formatted & Ready!';
        if (successDesc) successDesc.innerHTML = `Thank you, <strong>${name}</strong>! Your project inquiry has been formatted. Choose your preferred way to send directly to John Kevin Ramirez:`;
        // Trigger mailto directly
        try {
          window.location.href = mailtoUrl;
        } catch (_) {}
      }

      // Reset submit button state for next time
      contactSubmit.disabled = false;
      contactSubmit.innerHTML = '<span>Send Message</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
    });

    if (resetFormBtn) {
      resetFormBtn.addEventListener('click', () => {
        contactSuccessBox.style.display = 'none';
        contactForm.style.display = 'flex';
        contactForm.reset();
      });
    }
  }

  // 10. SCROLL-TRIGGERED REVEAL ANIMATIONS
  // Ensure every section, card, header and timeline item has reveal animation
  const autoRevealSelectors = [
    'section',
    '.section-header-pandawa',
    '.hero-stat-card',
    '.about-photo-card',
    '.about-content-body',
    '.pain-card-pandawa',
    '.process-card-pandawa',
    '.advantage-card',
    '.project-card-pandawa',
    '.timeline-item-pandawa',
    '.education-card-pandawa',
    '.faq-row-pandawa',
    '.contact-info-card',
    '.contact-form-pandawa'
  ];

  autoRevealSelectors.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => el.classList.add('reveal'));
  });

  const revealElements = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealElements.length) {
    const revealObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.08,
      rootMargin: '0px 0px -30px 0px'
    });

    revealElements.forEach(el => revealObserver.observe(el));
  } else {
    revealElements.forEach(el => el.classList.add('is-visible'));
  }

  // 11. INTERACTIVE CARD SPOTLIGHT GLOW (Mouse Position Glow)
  const spotlightTargets = document.querySelectorAll(
    '.project-card-pandawa, .hero-stat-card, .process-card-pandawa, .pain-card-pandawa, .advantage-card, .education-card-pandawa, .timeline-item-pandawa, .contact-info-card, .contact-form-pandawa'
  );

  spotlightTargets.forEach(card => {
    card.classList.add('spotlight-card');
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  });

  // 12. AMBIENT CURSOR GLOW ORB (Nexus AI / Pandawa Ambient Lighting)
  const glowOrb = document.createElement('div');
  glowOrb.className = 'cursor-glow-orb';
  document.body.appendChild(glowOrb);

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let orbX = mouseX;
  let orbY = mouseY;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (!glowOrb.classList.contains('active')) {
      glowOrb.classList.add('active');
    }
  }, { passive: true });

  const animateOrb = () => {
    orbX += (mouseX - orbX) * 0.12;
    orbY += (mouseY - orbY) * 0.12;
    glowOrb.style.transform = `translate(${orbX}px, ${orbY}px) translate(-50%, -50%)`;
    requestAnimationFrame(animateOrb);
  };
  requestAnimationFrame(animateOrb);

  window.addEventListener('mouseleave', () => {
    glowOrb.classList.remove('active');
  });
});
