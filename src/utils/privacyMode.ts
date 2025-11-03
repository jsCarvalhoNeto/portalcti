// Utilitário para detectar e lidar com problemas de navegação privada
export const PrivacyModeUtils = {
  /**
   * Verifica se o navegador está em modo de navegação privada
   */
  async isPrivateMode(): Promise<boolean> {
    try {
      // Tenta usar localStorage - falha em alguns navegadores no modo privado
      const testKey = '_privacy_test_' + Date.now();
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      
      // Verifica se o sessionStorage está disponível
      sessionStorage.setItem(testKey, 'test');
      sessionStorage.removeItem(testKey);
      
      return false;
    } catch (e) {
      return true;
    }
  },

  /**
   * Verifica se os cookies estão funcionando
   */
  checkCookieSupport(): boolean {
    try {
      const testName = '_cookie_test_' + Date.now();
      document.cookie = `${testName}=test; path=/; SameSite=Lax`;
      const cookieExists = document.cookie.includes(testName);
      
      // Limpar cookie de teste
      if (cookieExists) {
        document.cookie = `${testName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      }
      
      return cookieExists;
    } catch (e) {
      console.warn('Erro ao testar suporte a cookies:', e);
      return false;
    }
  },

  /**
   * Exibe aviso sobre navegação privada e problemas de cookies
   */
  showPrivacyModeWarning(): void {
    const warningId = 'privacy-mode-warning';
    
    // Remove aviso existente se houver
    const existingWarning = document.getElementById(warningId);
    if (existingWarning) {
      existingWarning.remove();
    }

    const warning = document.createElement('div');
    warning.id = warningId;
    warning.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: linear-gradient(90deg, #ff6b6b, #ffa726);
      color: white;
      padding: 12px 16px;
      text-align: center;
      font-size: 14px;
      font-weight: 500;
      z-index: 9999;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      animation: slideDown 0.3s ease-out;
    `;

    warning.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
        <span>⚠️</span>
        <span>
          <strong>Navegação Privada Detectada:</strong> 
          Alguns recursos podem não funcionar corretamente. 
          Para melhor experiência, use o navegador normal.
        </span>
        <button onclick="this.parentElement.parentElement.remove()" 
                style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); 
                       color: white; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px;">
          ✕
        </button>
      </div>
    `;

    // Adicionar CSS da animação
    if (!document.querySelector('#privacy-mode-styles')) {
      const style = document.createElement('style');
      style.id = 'privacy-mode-styles';
      style.textContent = `
        @keyframes slideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(warning);

    // Auto-remove após 10 segundos
    setTimeout(() => {
      if (document.getElementById(warningId)) {
        warning.style.animation = 'slideDown 0.3s ease-out reverse';
        setTimeout(() => warning.remove(), 300);
      }
    }, 10000);
  },

  /**
   * Verifica e lida com problemas de navegação privada
   */
  async handlePrivacyMode(): Promise<{
    isPrivate: boolean;
    cookiesWork: boolean;
    showedWarning: boolean;
  }> {
    const isPrivate = await this.isPrivateMode();
    const cookiesWork = this.checkCookieSupport();
    
    console.log('🔍 Privacy Mode Check:', {
      isPrivate,
      cookiesWork,
      userAgent: navigator.userAgent
    });

    let showedWarning = false;
    
    // Mostrar aviso se estiver em modo privado ou cookies não funcionarem
    if (isPrivate || !cookiesWork) {
      this.showPrivacyModeWarning();
      showedWarning = true;
    }

    return { isPrivate, cookiesWork, showedWarning };
  }
};

export default PrivacyModeUtils;