


document.addEventListener('DOMContentLoaded', function() {
    console.log('login-handler.js loaded');
    
    
    setupLoginOverlay();
    
    
    setupLoginButtons();
});


function setupLoginOverlay() {
    const loginOverlay = document.querySelector('.login-overlay');
    
    if (loginOverlay) {
        console.log('Login overlay found, checking if we need to show it');
        
        
        const container = document.querySelector('.countries-section');
        if (container) {
            
            if (getComputedStyle(container).position === 'static') {
                container.style.position = 'relative';
            }
            
            
            loginOverlay.style.position = 'absolute';
            loginOverlay.style.top = '2.5rem';
            loginOverlay.style.left = '0';
            loginOverlay.style.right = '0';
            loginOverlay.style.bottom = '0';
            loginOverlay.style.zIndex = '10';
            loginOverlay.style.display = 'flex';
            
            
            setTimeout(() => {
                loginOverlay.style.opacity = '1';
                loginOverlay.style.transform = 'translateY(0)';
            }, 100);
            
            loginOverlay.style.opacity = '0';
            loginOverlay.style.transform = 'translateY(10px)';
            loginOverlay.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        }
    } else {
        console.log('No login overlay found, user might be logged in');
    }
}


function setupLoginButtons() {
    
    const loginButtons = document.querySelectorAll('.login-overlay .btn');
    
    loginButtons.forEach(button => {
        
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
        });
        
        
        button.addEventListener('click', function() {
            
            this.style.transform = 'scale(0.98)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 100);
            
            
            localStorage.setItem('login_redirect', window.location.href);
            
            
        });
    });
}


function hideLoginOverlay() {
    const loginOverlay = document.querySelector('.login-overlay');
    if (loginOverlay) {
        console.log('Hiding login overlay');
        
        
        loginOverlay.style.opacity = '0';
        loginOverlay.style.transform = 'translateY(10px)';
        
        
        setTimeout(() => {
            loginOverlay.style.display = 'none';
            loginOverlay.style.zIndex = '-1';
        }, 300);
    }
}


function showLoginOverlay() {
    const loginOverlay = document.querySelector('.login-overlay');
    if (loginOverlay) {
        console.log('Showing login overlay');
        
        
        loginOverlay.style.display = 'flex';
        loginOverlay.style.zIndex = '10';
        loginOverlay.style.opacity = '0';
        loginOverlay.style.transform = 'translateY(10px)';
        
        
        setTimeout(() => {
            loginOverlay.style.opacity = '1';
            loginOverlay.style.transform = 'translateY(0)';
        }, 10);
    }
}


window.hideLoginOverlay = hideLoginOverlay;
window.showLoginOverlay = showLoginOverlay; 