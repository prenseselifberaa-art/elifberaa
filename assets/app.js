/*
 * elifberaa - ask-view controller and local answer engine.
 *
 * Facts come from window.PORTFOLIO_DATA (assets/data.js), a verbatim copy of
 * src/data-clean.json. Nothing here uses the network, storage, cookies or
 * third-party code, and no event handler is attached inline in the HTML.
 */
(function () {
  "use strict";

  var DATA = window.PORTFOLIO_DATA || {};
  var ABOUT = DATA.about || {};
  var CONTACT = DATA.contact || {};
  var LOCATION = DATA.location || {};
  var GITHUB = DATA.github || {};
  var SNAPSHOT = GITHUB.snapshot || {};

  var EMAIL = typeof CONTACT.email === "string" ? CONTACT.email : "";
  var LINKEDIN_URL =
    "https://www.linkedin.com/in/elif-%C3%A7%C4%B1%C4%9Fr%C4%B1k%C3%A7%C4%B1";
  var GITHUB_URL = "https://github.com/elifberaa";
  var RESUME_PATH = "/files/Elif-Beraa-Cigrikci-CV.pdf";
  var MAX_QUESTION = 500;
  var MONTHS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
  ];

  var pageView = document.getElementById("page-view");
  var askView = document.getElementById("ask-view");
  var questionTop = document.getElementById("ask-question-top");
  var thread = document.getElementById("ask-thread");
  var scrollBox = document.getElementById("ask-scroll");
  var askForm = document.getElementById("ask-form");
  var askInput = document.getElementById("ask-input");
  var askSubmit = document.getElementById("ask-submit");
  var askStatus = document.getElementById("ask-status");

  var runId = 0;
  var loaderTimer = 0;
  var loaderEl = null;
  var typing = null;
  var currentQuestion = "";
  var opener = null;
  var answerBusy = false;
  var pendingQuestions = [];

  var LOADER_HTML =
    '<div class="flex gap-2 items-start group self-start w-full relative group">' +
    '<div class="text-secondary-foreground rounded-lg py-2 break-words max-w-full whitespace-pre-wrap">' +
    '<div class="flex items-center space-x-2">' +
    '<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" class="text-foreground">' +
    '<circle cx="4" cy="12" r="2" fill="currentColor">' +
    '<animate id="spinner_qFRN" begin="0;spinner_OcgL.end+0.25s" attributeName="cy" calcMode="spline" dur="0.6s" values="12;6;12" keySplines=".33,.66,.66,1;.33,0,.66,.33"></animate>' +
    "</circle>" +
    '<circle cx="12" cy="12" r="2" fill="currentColor">' +
    '<animate begin="spinner_qFRN.begin+0.1s" attributeName="cy" calcMode="spline" dur="0.6s" values="12;6;12" keySplines=".33,.66,.66,1;.33,0,.66,.33"></animate>' +
    "</circle>" +
    '<circle cx="20" cy="12" r="2" fill="currentColor">' +
    '<animate id="spinner_OcgL" begin="spinner_qFRN.begin+0.2s" attributeName="cy" calcMode="spline" dur="0.6s" values="12;6;12" keySplines=".33,.66,.66,1;.33,0,.66,.33"></animate>' +
    "</circle>" +
    "</svg>" +
    "</div>" +
    "</div>" +
    "</div>";

  var RX = {
    resume: /\b(resume|cv|ozgecmis)/,
    contact: /\b(contact|email|e-mail|eposta|e-posta|reach|hire|gorusme|iletisim|ulas|mail)/,
    github: /\b(github|git hub|repos|repositories|repo|coding|code|kod)/,
    social: /\b(social|follow|linkedin|takip|sosyal)/,
    education:
      /\b(study|studied|studies|university|school|degree|education|graduate|graduated|egitim|okul|universite|mezun|lise)/,
    projects: /\b(project|projects|proje|projeler|built|portfolio|working on)/,
    skills:
      /\b(skill|skills|stack|tech|technology|technologies|tool|tools|yetenek|teknoloji|beceri|programming language)/,
    experience:
      /\b(work|works|worked|working|job|jobs|experience|experiences|company|companies|career|employment|employer|role|meslek|mesleg|deneyim|tecrube)/,
    languages: /\b(language|languages|dil|turkish|english)/,
    location:
      /\b(where|based|city|located|location|istanbul|nerede|nereli|konum|sehir|adres)/,
    thanks: /\b(thanks|thank|tesekkur)/,
    greeting: /(^|\s)(hello|hi|hey|merhaba|selam)/,
    about:
      /\b(who|about|yourself|introduction|background|name|kimsin|hakkinda|hakkinizda|kendin|what do you do|software engineer|engineer)/,
    sensitive: /\b(born|age|old|gpa|grade|grades|phone|telephone|telefon|award|awards|salary)\b/
  };

  var TURKISH_IS = /(^|[^a-zçğıöşü])iş/;

  function asArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function esc(value) {
    return String(value === null || value === undefined ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function turkishLower(value) {
    var text = String(value === null || value === undefined ? "" : value);
    try {
      return text.toLocaleLowerCase("tr");
    } catch (error) {
      return text.toLowerCase();
    }
  }

  function fold(value) {
    return String(value === null || value === undefined ? "" : value)
      .toLowerCase()
      .replace(/ı/g, "i")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function externalLink(url, label) {
    var href = String(url === null || url === undefined ? "" : url);
    if (!/^https?:\/\//i.test(href)) return esc(label);
    return (
      '<a href="' +
      esc(href) +
      '" target="_blank" rel="noopener noreferrer">' +
      esc(label) +
      "</a>"
    );
  }

  function mailLink() {
    if (!EMAIL) return "";
    var address = esc(EMAIL);
    return '<a href="mailto:' + address + '">' + address + "</a>";
  }

  function monthLabel(value) {
    if (typeof value !== "string") return "";
    var match = /^(\d{4})-(\d{2})$/.exec(value);
    if (!match) return value;
    var month = MONTHS[Number(match[2]) - 1];
    return month ? month + " " + match[1] : value;
  }

  function periodLabel(period, current) {
    if (!period) return "";
    var from = monthLabel(period.from);
    var to = monthLabel(period.to);
    if (from && to) return from + " - " + to;
    if (from) return current ? from + " - Present" : from;
    if (to) return "Until " + to;
    return "";
  }

  function oneLine(value, max) {
    var limit = max || 180;
    var text = String(value === null || value === undefined ? "" : value)
      .replace(/\s+/g, " ")
      .trim();
    if (!text) return "";
    if (text.length <= limit) return text;
    var sentence = text.match(/^(.+?[.!?])(?:\s|$)/);
    if (sentence && sentence[1].length <= limit) return sentence[1];
    var cut = text.slice(0, limit);
    var space = cut.lastIndexOf(" ");
    return (
      (space > limit * 0.6 ? cut.slice(0, space) : cut).replace(
        /[\s,;:]+$/,
        ""
      ) + "…"
    );
  }

  function levelLabel(level) {
    var key = String(level === null || level === undefined ? "" : level)
      .toLowerCase()
      .trim();
    if (key === "proficient") return "Proficient";
    if (key === "comfortable") return "Comfortable";
    if (key === "learning") return "Learning";
    return level ? esc(level) : "";
  }

  function answerGreeting() {
    var name = ABOUT.name || SNAPSHOT.name || "Elif";
    return (
      "<p>Hi. I am " +
      esc(name) +
      ", a software engineer passionate about data science and artificial intelligence.</p>" +
      "<p>You can ask me about my experience, education, projects or skills. " +
      "For example: <strong>Where have you worked?</strong> or " +
      "<strong>What is your tech stack?</strong></p>"
    );
  }

  function answerAbout() {
    var html = "";
    if (ABOUT.intro) html += "<p>" + esc(ABOUT.intro) + "</p>";
    if (ABOUT.currently) {
      html +=
        "<p><strong>Current role:</strong> " + esc(ABOUT.currently) + ".</p>";
    }
    var languages = asArray(ABOUT.languages).map(esc).join(", ");
    if (languages) {
      html += "<p><strong>Languages:</strong> " + languages + ".</p>";
    }
    return html || answerFallback();
  }

  function answerExperience() {
    var roles = asArray(DATA.experience);
    if (!roles.length) return answerFallback();
    var items = roles.map(function (role) {
      var title = esc(role.title || "");
      var company = role.company && role.company.name ? esc(role.company.name) : "";
      var dates = esc(periodLabel(role.period, role.current));
      var description = esc(oneLine(role.description, 240));
      var line = "<strong>" + title + "</strong>";
      if (company) line += ", " + company;
      if (dates) line += " (" + dates + ")";
      if (description) line += ". " + description;
      return "<li>" + line + "</li>";
    });
    return "<p>Roles from my experience:</p><ul>" + items.join("") + "</ul>";
  }

  function answerEducation() {
    var entries = asArray(DATA.education);
    if (!entries.length) return answerFallback();
    var items = entries.map(function (entry) {
      var degree = esc(entry.degree || entry.field || "");
      var school =
        entry.school && entry.school.name ? esc(entry.school.name) : "";
      var dates = esc(periodLabel(entry.period, entry.current));
      var description = esc(entry.description || "");
      var html = "<p><strong>" + degree + "</strong>";
      if (school) html += "<br>" + school;
      if (dates) html += "<br>" + dates;
      if (description) html += "<br>" + description;
      return html + "</p>";
    });
    return items.join("");
  }

  function answerSkills() {
    var groups = [];
    var byCategory = {};
    asArray(DATA.skills).forEach(function (skill) {
      var category = skill.category || "Other";
      if (!byCategory[category]) {
        byCategory[category] = { category: category, items: [] };
        groups.push(byCategory[category]);
      }
      byCategory[category].items.push(skill);
    });
    if (!groups.length) return answerFallback();
    var items = groups.map(function (group) {
      var parts = group.items.map(function (skill) {
        var name = esc(skill.name || "");
        var level = levelLabel(skill.level);
        return level ? name + " (" + level + ")" : name;
      });
      return (
        "<li><strong>" +
        esc(group.category) +
        ":</strong> " +
        parts.join(", ") +
        "</li>"
      );
    });
    return "<p>Skills by category:</p><ul>" + items.join("") + "</ul>";
  }

  function answerProjects() {
    var projects = asArray(DATA.projects);
    if (!projects.length) return answerFallback();
    var items = projects.map(function (project) {
      var title = esc(project.title || "");
      var tagline = esc(oneLine(project.tagline || project.description, 190));
      var github = null;
      asArray(project.links).forEach(function (link) {
        if (!github && link && link.kind === "github") github = link;
      });
      var line = "<strong>" + title + "</strong>";
      if (tagline) line += " — " + tagline;
      if (github) {
        line += " " + externalLink(github.href, github.label || "GitHub");
      }
      return "<li>" + line + "</li>";
    });
    return "<p>Projects:</p><ul>" + items.join("") + "</ul>";
  }

  function answerLocation() {
    var label = LOCATION.label || ABOUT.location || "Istanbul, Türkiye";
    var timezone = LOCATION.timezone || "";
    var html = "<p>I am based in " + esc(label) + ".</p>";
    if (timezone) {
      html += "<p><strong>Timezone:</strong> " + esc(timezone) + ".</p>";
    }
    return html;
  }

  function answerSocial() {
    return (
      "<p>You can follow me here:</p><ul>" +
      "<li>LinkedIn: " +
      externalLink(LINKEDIN_URL, "https://www.linkedin.com/in/elif-çığrıkçı") +
      "</li>" +
      "<li>GitHub: " +
      externalLink(GITHUB_URL, GITHUB_URL) +
      "</li></ul>"
    );
  }

  function answerGithub() {
    var login = SNAPSHOT.login || GITHUB.username || "elifberaa";
    var repos = Number(SNAPSHOT.repos);
    var stars = Number(SNAPSHOT.stars);
    var pinned = asArray(SNAPSHOT.pinned);
    var facts = [];
    if (Number.isFinite(repos)) facts.push(repos + " public repos");
    if (Number.isFinite(stars)) facts.push(stars + " stars");
    if (pinned.length) facts.push(pinned.length + " pinned repos");
    var html =
      "<p><strong>GitHub login:</strong> " +
      externalLink(GITHUB_URL, login) +
      "</p>";
    if (facts.length) html += "<p>" + facts.join(", ") + ".</p>";
    if (pinned.length) {
      html +=
        "<p><strong>Pinned:</strong> " +
        pinned
          .map(function (item) {
            return esc(item && item.name ? item.name : "");
          })
          .join(", ") +
        ".</p>";
    }
    return html;
  }

  function answerResume() {
    var name = SNAPSHOT.name || ABOUT.name || "Elif";
    return (
      "<p>You can open my resume here: " +
      '<a href="' +
      RESUME_PATH +
      '" target="_blank" rel="noopener noreferrer">' +
      esc(name) +
      " CV (PDF)</a>.</p>"
    );
  }

  function answerContact() {
    var lines = [];
    if (EMAIL) {
      lines.push("<p><strong>Email:</strong> " + mailLink() + "</p>");
    }
    lines.push(
      "<p><strong>LinkedIn:</strong> " +
        externalLink(
          LINKEDIN_URL,
          "https://www.linkedin.com/in/elif-çığrıkçı"
        ) +
        "</p>"
    );
    return lines.join("");
  }

  function answerLanguages() {
    var languages = asArray(ABOUT.languages);
    if (!languages.length) return answerFallback();
    return languages
      .map(function (item) {
        var text = String(item === null || item === undefined ? "" : item);
        var match = /^(.+?)\s*\(([^)]+)\)\s*$/.exec(text);
        var rawName = match ? match[1].trim() : text.trim();
        var level = match ? match[2].trim() : "";
        var name =
          rawName === "Türkçe"
            ? "Turkish"
            : rawName === "İngilizce"
              ? "English"
              : rawName;
        return "<p><strong>" + esc(name) + ":</strong> " + esc(level) + "</p>";
      })
      .join("");
  }

  function answerThanks() {
    var html = "<p>You are welcome.</p>";
    if (EMAIL) {
      html +=
        "<p>If you have another question, you can email me at " +
        mailLink() +
        ".</p>";
    }
    return html;
  }

  function answerFallback() {
    var html =
      "<p>I do not have that detail in my portfolio information.</p>" +
      "<p>You can ask me about my experience, education, skills or projects";
    if (EMAIL) html += ", or email me at " + mailLink();
    html += ".</p>";
    html +=
      "<p>For example: <strong>Where have you worked?</strong> " +
      "<strong>What did you study?</strong> " +
      "<strong>What is your tech stack?</strong></p>";
    return html;
  }

  function detectIntent(question) {
    var text = fold(question);
    var rawTurkish = turkishLower(question);
    if (RX.sensitive.test(text)) return "fallback";
    if (RX.resume.test(text)) return "resume";
    if (RX.contact.test(text)) return "contact";
    if (RX.github.test(text)) return "github";
    if (RX.social.test(text)) return "social";
    if (RX.education.test(text)) return "education";
    if (RX.projects.test(text)) return "projects";
    if (RX.skills.test(text)) return "skills";
    if (RX.experience.test(text) || TURKISH_IS.test(rawTurkish)) {
      return "experience";
    }
    if (RX.languages.test(text)) return "languages";
    if (RX.location.test(text)) return "location";
    if (RX.thanks.test(text)) return "thanks";
    if (RX.greeting.test(text)) return "greeting";
    if (RX.about.test(text)) return "about";
    return "fallback";
  }

  function answerFor(question) {
    switch (detectIntent(question)) {
      case "greeting":
        return answerGreeting();
      case "about":
        return answerAbout();
      case "experience":
        return answerExperience();
      case "education":
        return answerEducation();
      case "skills":
        return answerSkills();
      case "projects":
        return answerProjects();
      case "location":
        return answerLocation();
      case "social":
        return answerSocial();
      case "github":
        return answerGithub();
      case "resume":
        return answerResume();
      case "contact":
        return answerContact();
      case "languages":
        return answerLanguages();
      case "thanks":
        return answerThanks();
      default:
        return answerFallback();
    }
  }

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function scrollBottom() {
    if (!scrollBox) return;
    scrollBox.scrollTop = scrollBox.scrollHeight;
  }

  function cleanQuestion(value) {
    return String(value === null || value === undefined ? "" : value)
      .trim()
      .slice(0, MAX_QUESTION);
  }

  function focusInput() {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    try {
      askInput.focus({ preventScroll: true });
    } catch (error) {
      askInput.focus();
    }
  }

  function buildLoader() {
    var holder = document.createElement("div");
    holder.innerHTML = LOADER_HTML;
    return holder.firstElementChild || holder;
  }

  function buildQuestionBubble(text) {
    var wrap = document.createElement("div");
    wrap.className =
      "flex gap-2 items-start group self-end flex-row-reverse relative group";
    var bubble = document.createElement("div");
    bubble.className =
      "p-2 px-5 bg-primary text-primary-foreground rounded-3xl break-words max-w-full whitespace-pre-wrap";
    bubble.style.background = "rgb(230, 74, 141)";
    bubble.style.color = "rgb(0, 0, 0)";
    var prose = document.createElement("div");
    prose.className =
      "prose w-full max-w-none whitespace-normal break-words leading-[1.6]";
    var paragraph = document.createElement("p");
    paragraph.className = "my-3 first:mt-0 last:mb-0";
    paragraph.textContent = text;
    prose.appendChild(paragraph);
    bubble.appendChild(prose);
    wrap.appendChild(bubble);
    return wrap;
  }

  function buildAnswerBubble(html) {
    var wrap = document.createElement("div");
    wrap.className =
      "flex gap-2 items-start group self-start w-full relative group";
    var bubble = document.createElement("div");
    bubble.className =
      "text-secondary-foreground rounded-lg py-2 break-words max-w-full whitespace-pre-wrap";
    var prose = document.createElement("div");
    prose.className =
      "prose w-full max-w-none whitespace-normal break-words leading-[1.6] [--tw-prose-body:currentColor]";
    prose.innerHTML = html;
    bubble.appendChild(prose);
    wrap.appendChild(bubble);
    return { wrap: wrap, prose: prose };
  }

  function cancelLoad() {
    if (loaderTimer) {
      window.clearTimeout(loaderTimer);
      loaderTimer = 0;
    }
    if (loaderEl) {
      if (loaderEl.parentNode) loaderEl.parentNode.removeChild(loaderEl);
      loaderEl = null;
    }
  }

  function finishTyping() {
    if (!typing) return;
    var active = typing;
    typing = null;
    active.finish();
  }

  function typeAnswer(prose, token) {
    var nodes = [];
    var walker = document.createTreeWalker(prose, NodeFilter.SHOW_TEXT, null);
    while (walker.nextNode()) {
      var value = walker.currentNode.nodeValue;
      if (value && value.trim() !== "") nodes.push(walker.currentNode);
    }
    if (!nodes.length) return;

    var fullTexts = nodes.map(function (node) {
      return node.nodeValue;
    });
    nodes.forEach(function (node) {
      node.nodeValue = "";
    });

    var caret = document.createElement("span");
    caret.className = "ask-typing";
    caret.setAttribute("aria-hidden", "true");
    var index = 0;
    var chars = 0;
    var raf = 0;
    var ticks = 0;
    var done = false;
    var totalChars = fullTexts.reduce(function (sum, text) {
      return sum + text.length;
    }, 0);
    var offsets = [];
    var cursor = 0;
    fullTexts.forEach(function (text) {
      offsets.push(cursor);
      cursor += text.length;
    });
    var duration = Math.min(2400, Math.max(900, totalChars * 4));
    var startedAt = 0;

    function placeCaret() {
      var node = nodes[index];
      if (!node || !node.parentNode) return;
      if (caret.parentNode !== node.parentNode || caret.previousSibling !== node) {
        node.parentNode.insertBefore(caret, node.nextSibling);
      }
    }

    function reveal(count) {
      nodes.forEach(function (node, i) {
        var visible = Math.max(
          0,
          Math.min(fullTexts[i].length, count - offsets[i])
        );
        if (node.nodeValue.length !== visible) {
          node.nodeValue = fullTexts[i].slice(0, visible);
        }
        if (visible > 0) index = i;
      });
      chars = Math.max(0, count - offsets[index]);
    }

    function finish() {
      if (done) return;
      done = true;
      if (raf) window.cancelAnimationFrame(raf);
      nodes.forEach(function (node, i) {
        node.nodeValue = fullTexts[i];
      });
      if (caret.parentNode) caret.parentNode.removeChild(caret);
      if (typing && typing.finish === finish) typing = null;
      scrollBottom();
    }

    function step(now) {
      if (done || token !== runId) {
        finish();
        return;
      }
      if (!startedAt) startedAt = now;
      var progress = Math.min(1, (now - startedAt) / duration);
      reveal(Math.round(totalChars * progress));
      placeCaret();
      ticks += 1;
      if (ticks % 10 === 0) scrollBottom();
      if (progress >= 1) {
        finish();
        return;
      }
      raf = window.requestAnimationFrame(step);
    }

    typing = { finish: finish };
    raf = window.requestAnimationFrame(step);
  }

  function startAnswer(question) {
    finishTyping();
    cancelLoad();
    runId += 1;
    answerBusy = true;
    syncAskSubmit();
    var token = runId;
    var reduced = prefersReducedMotion();
    var loader = buildLoader();
    loaderEl = loader;
    thread.setAttribute("aria-busy", "true");
    if (askStatus) askStatus.textContent = "Thinking about your question.";
    thread.appendChild(loader);
    scrollBottom();

    loaderTimer = window.setTimeout(
      function () {
        loaderTimer = 0;
        if (token !== runId || !askView || askView.hidden) return;
        loaderEl = null;
        if (loader.parentNode) loader.parentNode.removeChild(loader);

        var html;
        try {
          html = answerFor(question);
        } catch (error) {
          html = answerFallback();
        }
        var bubble = buildAnswerBubble(html);
        thread.appendChild(bubble.wrap);
        answerBusy = false;
        thread.setAttribute("aria-busy", "false");
        if (askStatus) askStatus.textContent = "Answer ready.";
        syncAskSubmit();
        scrollBottom();
        if (!reduced) typeAnswer(bubble.prose, token);
        if (pendingQuestions.length) {
          var next = pendingQuestions.shift();
          answerBusy = true;
          syncAskSubmit();
          window.setTimeout(function () {
            askFollowUp(next);
          }, 0);
        }
      },
      reduced ? 450 : 850
    );
  }

  function resetComposer() {
    if (askForm) askForm.reset();
    if (askInput) askInput.value = "";
    if (askSubmit) askSubmit.disabled = true;
  }

  function currentUrl() {
    try {
      return new URL(window.location.href);
    } catch (error) {
      return null;
    }
  }

  function getQ() {
    var url = currentUrl();
    if (!url) return "";
    var value = url.searchParams.get("q");
    return value === null ? "" : value;
  }

  function hasQ() {
    var url = currentUrl();
    return !!(url && url.searchParams.has("q"));
  }

  function urlWithQ(question) {
    var url = currentUrl();
    if (!url) return window.location.href;
    url.searchParams.set("q", question);
    return url.pathname + url.search + url.hash;
  }

  function urlWithoutQ() {
    var url = currentUrl();
    if (!url) return window.location.pathname;
    url.searchParams.delete("q");
    return url.pathname + url.search + url.hash;
  }

  function openAsk(value, options) {
    var question = cleanQuestion(value);
    if (!question) return;
    var opts = options || {};

    pendingQuestions.length = 0;
    finishTyping();
    cancelLoad();
    pageView.hidden = true;
    askView.hidden = false;
    document.body.classList.add("ask-open");
    if (window.Background) window.Background.suspend();
    if (opts.opener) opener = opts.opener;
    currentQuestion = question;
    questionTop.textContent = question;

    while (thread.firstChild) thread.removeChild(thread.firstChild);
    resetComposer();
    startAnswer(question);

    if (window.matchMedia("(pointer: fine)").matches) focusInput();

    if (opts.push !== false) {
      try {
        window.history.pushState({ q: question }, "", urlWithQ(question));
      } catch (error) {
        /* History can be unavailable in restricted contexts. */
      }
    }
  }

  function askFollowUp(value) {
    var question = cleanQuestion(value);
    if (!question) return;
    currentQuestion = question;
    questionTop.textContent = question;
    thread.appendChild(buildQuestionBubble(question));
    resetComposer();
    startAnswer(question);
    focusInput();
  }

  function visibleTiles() {
    var all = pageView.querySelectorAll(
      'button[type="button"][aria-label]'
    );
    return Array.prototype.filter.call(all, function (button) {
      return (
        !button.closest("form") &&
        !button.closest("#anim-dock") &&
        button.getClientRects().length > 0
      );
    });
  }

  function focusTarget(question) {
    if (opener && opener.isConnected && opener.getClientRects().length > 0) {
      return opener;
    }
    var tiles = visibleTiles();
    if (!tiles.length) return null;
    var wanted = fold(question);
    for (var i = 0; i < tiles.length; i += 1) {
      if (fold(tiles[i].getAttribute("aria-label")) === wanted) return tiles[i];
    }
    return tiles[0];
  }

  function closeAsk(options) {
    var opts = options || {};
    if (!askView || askView.hidden) return;
    var lastQuestion = currentQuestion;
    finishTyping();
    cancelLoad();
    runId += 1;
    currentQuestion = "";

    askView.hidden = true;
    answerBusy = false;
    pendingQuestions.length = 0;
    thread.setAttribute("aria-busy", "false");
    if (askStatus) askStatus.textContent = "";
    pageView.hidden = false;
    if (window.Background) window.Background.resume();
    document.body.classList.remove("ask-open");
    if (askInput) askInput.blur();

    if (opts.updateHistory !== false && hasQ()) {
      try {
        window.history.pushState(null, "", urlWithoutQ());
      } catch (error) {
        /* Ignore history failures. */
      }
    }

    var target = focusTarget(lastQuestion);
    if (target) {
      try {
        target.focus({ preventScroll: true });
      } catch (error) {
        target.focus();
      }
    }
    opener = null;
  }

  function onPopState() {
    var question = getQ();
    if (question) {
      if (askView.hidden || fold(question) !== fold(currentQuestion)) {
        openAsk(question, { push: false, opener: null });
      }
    } else if (!askView.hidden) {
      closeAsk({ updateHistory: false });
    }
  }

  function syncAskSubmit() {
    if (askSubmit) {
      askSubmit.disabled = !askInput.value.trim();
    }
  }

  function bindPage() {
    var tiles = pageView.querySelectorAll(
      'button[type="button"][aria-label]'
    );
    Array.prototype.forEach.call(tiles, function (button) {
      if (button.closest("form") || button.closest("#anim-dock")) return;
      button.addEventListener("click", function (event) {
        event.preventDefault();
        openAsk(button.getAttribute("aria-label") || "", {
          opener: button,
          push: true
        });
      });
    });

    var forms = pageView.querySelectorAll("form");
    Array.prototype.forEach.call(forms, function (form) {
      var input = form.querySelector("input");
      var submit = form.querySelector('button[type="submit"]');
      if (!input) return;
      var sync = function () {
        if (submit) submit.disabled = !input.value.trim();
      };
      input.addEventListener("input", sync);
      sync();
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var value = input.value;
        if (!value.trim()) return;
        openAsk(value, { push: true });
        input.value = "";
        sync();
      });
    });

  }

  function bindAsk() {
    askInput.addEventListener("input", syncAskSubmit);
    syncAskSubmit();
    askForm.addEventListener("submit", function (event) {
      event.preventDefault();
      if (answerBusy) {
        var queued = cleanQuestion(askInput.value);
        if (queued && pendingQuestions.length < 3) {
          pendingQuestions.push(queued);
          resetComposer();
        }
        return;
      }
      var value = cleanQuestion(askInput.value);
      if (!value) return;
      askFollowUp(value);
    });

    var back = document.getElementById("ask-back");
    var avatar = document.getElementById("ask-avatar");
    if (back) {
      back.addEventListener("click", function (event) {
        event.preventDefault();
        closeAsk();
      });
    }
    if (avatar) {
      avatar.addEventListener("click", function (event) {
        event.preventDefault();
        closeAsk();
      });
    }

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !askView.hidden) {
        event.preventDefault();
        closeAsk();
      }
    });

    window.addEventListener("popstate", onPopState);
  }

  function init() {
    if (
      !pageView ||
      !askView ||
      !questionTop ||
      !thread ||
      !askForm ||
      !askInput ||
      !askSubmit
    ) {
      return;
    }
    bindPage();
    bindAsk();
    var question = cleanQuestion(getQ());
    if (question) openAsk(question, { push: false });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
