export function getResponsiveStyles(): string {
  return `
    @media (max-width: 768px) {
      .bugspark-annotation-toolbar {
        padding: 8px 10px; gap: 4px;
      }
      .bugspark-tool-btn {
        width: 44px; height: 44px; border-radius: 10px;
      }
      .bugspark-tool-btn__icon { width: 20px; height: 20px; }
      .bugspark-tool-btn__icon svg { width: 20px; height: 20px; }
      .bugspark-tool-btn__label { font-size: 8px; }

      .bugspark-color-btn {
        width: 30px; height: 30px; min-width: 30px; min-height: 30px;
      }
      .bugspark-width-btn {
        width: 40px; height: 40px;
      }
      .bugspark-action-btn {
        height: 40px;
      }
      .bugspark-action-btn--undo {
        width: 40px; height: 40px;
      }
      .bugspark-action-btn__text { display: none; }
      .bugspark-action-btn--done,
      .bugspark-action-btn--cancel {
        width: 40px; padding: 0;
        justify-content: center;
      }
      .bugspark-toolbar-section--actions {
        margin-left: auto;
      }
    }
    @media (max-width: 640px) {
      .bugspark-modal {
        width: 100%; max-width: 100%; height: 100vh; max-height: 100vh;
        border-radius: 0;
      }
      .bugspark-field__row { flex-direction: column; gap: 0; }
      .bugspark-annotation-toolbar {
        padding: 6px 8px; gap: 3px;
      }
      .bugspark-tool-btn {
        width: 46px; height: 46px;
      }
      .bugspark-tool-btn__icon { width: 22px; height: 22px; }
      .bugspark-tool-btn__icon svg { width: 22px; height: 22px; }
      .bugspark-color-btn {
        width: 32px; height: 32px; min-width: 32px; min-height: 32px;
      }
      .bugspark-annotation-toolbar__separator {
        height: 28px; margin: 0 2px;
      }
    }
  `;
}
