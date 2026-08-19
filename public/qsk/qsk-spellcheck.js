(function (global) {
  'use strict';

  let TYPO_CORRECTIONS = {};
  let CONFUSED_WORD_PAIRS = [];
  let dataLoaded = false;
  let loadPromise = null;

  function loadData() {
    if (loadPromise) return loadPromise;
    loadPromise = new Promise((resolve) => {
      if (typeof window.QSK_SPELLCHECK_DATA === 'undefined') {
        console.warn('QSKSpellCheck: qsk-spellcheck-data.js not found or did not load -- keep it in the same folder, loaded before qsk-spellcheck.js.');
        resolve();
        return;
      }
      TYPO_CORRECTIONS = window.QSK_SPELLCHECK_DATA.TYPO_CORRECTIONS || {};
      CONFUSED_WORD_PAIRS = window.QSK_SPELLCHECK_DATA.CONFUSED_WORD_PAIRS || [];
      dataLoaded = true;
      resolve();
    });
    return loadPromise;
  }
  loadData();

  function tokenize(text) {
    const matches = String(text || '').match(/[A-Za-z']+/g);
    return matches || [];
  }

  function scoreContext(fullTextLower, clueWords) {
    if (!clueWords || clueWords.length === 0) return 0;
    let score = 0;
    for (const clue of clueWords) {
      const escaped = clue.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const wordBoundaryPattern = new RegExp('\\b' + escaped + '\\b', 'i');
      if (wordBoundaryPattern.test(fullTextLower)) score++;
    }
    return score;
  }

  function checkText(text) {
    if (!dataLoaded) {
      console.warn('QSKSpellCheck: word lists are not loaded yet — call await QSKSpellCheck.ready() first. Returning no findings for now.');
      return [];
    }

    const findings = [];
    const words = tokenize(text);
    const fullTextLower = String(text || '').toLowerCase();
    const seen = new Set();

    words.forEach((rawWord) => {
      const lower = rawWord.toLowerCase();
      const dedupeKey = lower;
      if (seen.has(dedupeKey)) return;

      if (TYPO_CORRECTIONS.hasOwnProperty(lower)) {
        seen.add(dedupeKey);
        findings.push({
          word: rawWord,
          type: 'typo',
          severity: 'warning',
          message: `Possible typo — did you mean "${TYPO_CORRECTIONS[lower]}"?`,
          suggestion: TYPO_CORRECTIONS[lower]
        });
        return;
      }

      const pairEntry = CONFUSED_WORD_PAIRS.find((entry) =>
        entry.words.some((w) => w.toLowerCase() === lower)
      );
      if (pairEntry) {
        const others = pairEntry.words.filter((w) => w.toLowerCase() !== lower);
        const hasAnyClues = pairEntry.contextClues && Object.keys(pairEntry.contextClues).length > 0;

        let bestGuess = null;
        let bestScore = 0;
        let typedWordScore = 0;
        pairEntry.words.forEach((candidate) => {
          const clues = pairEntry.contextClues ? pairEntry.contextClues[candidate.toLowerCase()] : null;
          const score = scoreContext(fullTextLower, clues);
          if (candidate.toLowerCase() === lower) typedWordScore = score;
          if (score > bestScore) { bestScore = score; bestGuess = candidate; }
        });

        if (hasAnyClues && bestScore > 0 && typedWordScore >= bestScore) {
          seen.add(dedupeKey);
        } else if (hasAnyClues && bestGuess && bestGuess.toLowerCase() !== lower && bestScore > 0) {
          seen.add(dedupeKey);
          findings.push({
            word: rawWord,
            type: 'confused-word',
            severity: 'warning',
            message: `"${rawWord}" is used here, but nearby words suggest you may have meant "${bestGuess}". ${pairEntry.hint}`,
            suggestion: bestGuess
          });
        } else if (!hasAnyClues) {
          seen.add(dedupeKey);
          findings.push({
            word: rawWord,
            type: 'confused-word',
            severity: 'note',
            message: `"${rawWord}" is often confused with ${others.map((w) => '"' + w + '"').join(' / ')}. ${pairEntry.hint} Worth a quick double-check.`,
            suggestion: null
          });
        }
      }
    });

    return findings;
  }

  function checkCell(cellValue) {
    return checkText(cellValue);
  }

  global.QSKSpellCheck = {
    checkText: checkText,
    checkCell: checkCell,
    ready: function () { return loadPromise || loadData(); },
    get _typoList() { return TYPO_CORRECTIONS; },
    get _confusedPairs() { return CONFUSED_WORD_PAIRS; }
  };

})(window);
