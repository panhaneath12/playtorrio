import { useEffect, useRef } from 'react';

interface UseSpatialNavOptions {
  activeScope?: string; // Scope identifier to constrain navigation to a modal or viewport
  onBack?: () => void;
  enabled?: boolean;
}

export function useSpatialNav({ activeScope = 'main', onBack, enabled = true }: UseSpatialNavOptions = {}) {
  const activeScopeRef = useRef(activeScope);
  const onBackRef = useRef(onBack);
  const lastScopeRef = useRef(activeScope);
  const lastFocusedByScopeRef = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    // If scope changed, record focus from previous scope and try restoring focus in new scope
    const prevScope = lastScopeRef.current;
    if (prevScope !== activeScope) {
      // If we are leaving previous scope, save what was focused
      const activeEl = document.activeElement as HTMLElement | null;
      if (activeEl && activeEl.getAttribute('data-tv-nav') === 'true') {
        lastFocusedByScopeRef.current[prevScope] = activeEl;
      }

      // If returning to a scope (like 'main'), restore previously focused element
      const targetToRestore = lastFocusedByScopeRef.current[activeScope];
      if (targetToRestore && document.body.contains(targetToRestore)) {
        setTimeout(() => {
          try {
            targetToRestore.focus();
            targetToRestore.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
          } catch (_) {}
        }, 50);
      }

      lastScopeRef.current = activeScope;
    }

    activeScopeRef.current = activeScope;
    onBackRef.current = onBack;
  }, [activeScope, onBack]);

  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(e: KeyboardEvent) {
      // 1. Handle Remote Control Back Button (Escape, Backspace, Android Back Keycode 4 or 10009)
      if (
        e.key === 'Escape' || 
        e.key === 'Backspace' || 
        e.keyCode === 27 || 
        e.keyCode === 8 || 
        e.keyCode === 4 || 
        e.keyCode === 10009
      ) {
        if (onBackRef.current) {
          e.preventDefault();
          onBackRef.current();
          return;
        }
      }

      // 2. Directions: ArrowUp, ArrowDown, ArrowLeft, ArrowRight, D-Pad Center / Enter
      const isUp = e.key === 'ArrowUp' || e.keyCode === 38 || e.keyCode === 19;
      const isDown = e.key === 'ArrowDown' || e.keyCode === 40 || e.keyCode === 20;
      const isLeft = e.key === 'ArrowLeft' || e.keyCode === 37 || e.keyCode === 21;
      const isRight = e.key === 'ArrowRight' || e.keyCode === 39 || e.keyCode === 22;
      const isEnter = e.key === 'Enter' || e.keyCode === 13 || e.keyCode === 66 || e.keyCode === 23; // 66/23 is DPAD_CENTER on Android TV

      if (!isUp && !isDown && !isLeft && !isRight && !isEnter) return;

      const currentScope = activeScopeRef.current;
      const selector = `[data-tv-scope="${currentScope}"] [data-tv-nav="true"], [data-tv-nav="true"][data-tv-scope="${currentScope}"]`;
      const focusableElements = Array.from(document.querySelectorAll<HTMLElement>(selector)).filter(el => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && 
               style.visibility !== 'hidden' && 
               !el.hasAttribute('disabled') &&
               el.offsetParent !== null;
      });

      if (focusableElements.length === 0) return;

      const activeElement = document.activeElement as HTMLElement | null;

      // Handle Enter (DPAD_CENTER)
      if (isEnter) {
        if (activeElement && focusableElements.includes(activeElement)) {
          activeElement.click();
          e.preventDefault();
        }
        return;
      }

      // If nothing in this scope is currently focused, focus the best candidate or first one
      if (!activeElement || !focusableElements.includes(activeElement)) {
        const remembered = lastFocusedByScopeRef.current[currentScope];
        const initial = (remembered && focusableElements.includes(remembered)) ? remembered : focusableElements[0];
        initial.focus();
        initial.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        e.preventDefault();
        return;
      }

      // 3. 2D Euclidean Distance Vector Navigation
      const currentRect = activeElement.getBoundingClientRect();
      const currentCenterX = currentRect.left + currentRect.width / 2;
      const currentCenterY = currentRect.top + currentRect.height / 2;

      let bestCandidate: HTMLElement | null = null;
      let minDistance = Infinity;

      for (const candidate of focusableElements) {
        if (candidate === activeElement) continue;

        const candidateRect = candidate.getBoundingClientRect();
        const candidateCenterX = candidateRect.left + candidateRect.width / 2;
        const candidateCenterY = candidateRect.top + candidateRect.height / 2;

        const dx = candidateCenterX - currentCenterX;
        const dy = candidateCenterY - currentCenterY;

        // Check direction
        let isEligible = false;
        if (isRight && dx > 8) isEligible = true;
        if (isLeft && dx < -8) isEligible = true;
        if (isDown && dy > 8) isEligible = true;
        if (isUp && dy < -8) isEligible = true;

        if (!isEligible) continue;

        // Weight lateral distance higher to prefer elements in the direct line of sight
        let distance: number;
        if (isRight || isLeft) {
          distance = Math.abs(dx) + Math.abs(dy) * 2.5;
        } else {
          distance = Math.abs(dy) + Math.abs(dx) * 1.8;
        }

        if (distance < minDistance) {
          minDistance = distance;
          bestCandidate = candidate;
        }
      }

      if (bestCandidate) {
        e.preventDefault();
        bestCandidate.focus();
        bestCandidate.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        // Save current focus in this scope
        lastFocusedByScopeRef.current[currentScope] = bestCandidate;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled]);
}
