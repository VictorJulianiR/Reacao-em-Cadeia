import { UIElements, INITIAL_HP } from './config/gameConfig.js';

export class UIManager {
    constructor(soundManager) {
        this.elements = UIElements;
        this.soundManager = soundManager;
        this.tooltipTimeout = null;
    }

    logMessage(message) {
        const p = document.createElement('p');
        p.textContent = `> ${message}`;
        this.elements.info.log.prepend(p);
    }
    
    createExplosion(targetPlayerId) {
        const targetElement = targetPlayerId === 'player' ? this.elements.player.area : this.elements.opponent.area;
        const explosion = document.createElement('div');
        explosion.className = 'explosion';
        targetElement.appendChild(explosion);
        setTimeout(() => explosion.remove(), 600);
    }

    renderCard(card, isBack = false) {
        const cardEl = document.createElement('div');
        cardEl.classList.add('card');
        if (isBack) {
            cardEl.classList.add('card-back');
            return cardEl;
        }
        const chargeClass = card.charge > 0 ? 'charge-positive' : (card.charge < 0 ? 'charge-negative' : 'charge-neutral');
        cardEl.innerHTML = `<div class="card-header"><span class="card-name">${card.name}</span><span class="card-z">${card.z}</span></div><div class="card-symbol">${card.symbol}</div><div class="card-charge ${chargeClass}">${card.charge > 0 ? '+' : ''}${card.charge}</div>`;
        cardEl.querySelector('.card-symbol').style.color = card.color;
        return cardEl;
    }
    
    updatePlayerUI(player) {
        const ui = player.id === 'player' ? this.elements.player : this.elements.opponent;
        ui.hpText.textContent = `${player.hp}/${INITIAL_HP}`;
        const hpPercent = (player.hp / INITIAL_HP);
        ui.hpFill.style.width = `${hpPercent * 100}%`;
        ui.hpFill.style.backgroundPosition = `${(1 - hpPercent) * 100}%`;
        ui.deckCount.textContent = player.deck.length;

        ui.hand.innerHTML = '';
        if (player.id === 'player') {
            player.hand.forEach((card) => {
                const cardEl = this.renderCard(card);
                ui.hand.appendChild(cardEl);
            });
        } else {
            player.hand.forEach(() => {
                ui.hand.appendChild(this.renderCard(null, true));
            });
        }
    }

    updateReactionUI(reactionCompound, charge, mass) {
        this.elements.reaction.charge.textContent = charge > 0 ? `+${charge}` : charge;
        this.elements.reaction.charge.className = `stat-value ${charge > 0 ? 'charge-positive' : (charge < 0 ? 'charge-negative' : 'charge-neutral')}`;
        this.elements.reaction.mass.textContent = mass;

        this.elements.reactionArea.classList.remove('hyper-unstable', 'superheavy-unstable');
    }
    
    addCardToReaction(card) {
        const newCardEl = this.renderCard(card);
        newCardEl.classList.add('animate-in');
        this.elements.reaction.compound.appendChild(newCardEl);
    }
    
    clearReactionUI() {
        this.elements.reaction.compound.innerHTML = '';
        this.elements.reactionArea.classList.remove('hyper-unstable', 'superheavy-unstable');
    }
    
    setTurnIndicator(player) {
        const indicator = this.elements.info.turnIndicator;
        if (player.id === 'player') {
            indicator.textContent = "Seu Turno de Agir!";
            indicator.style.borderColor = 'var(--neon-blue)';
        } else {
            indicator.textContent = "IA está Calculando...";
            indicator.style.borderColor = 'var(--neon-purple)';
        }
        this.elements.player.area.classList.toggle('active', player.id === 'player');
        this.elements.opponent.area.classList.toggle('active', player.id === 'opponent');
    }

    showGameOver(winnerName) {
        this.elements.info.gameOverMessage.textContent = `${winnerName} VENCEU A BATALHA!`;
        this.elements.gameOverScreen.style.display = 'flex';
    }

    showDeckSelection(deckLists, callback) {
        this.elements.deckSelectionOptions.innerHTML = '';
        for (const deckKey in deckLists) {
            const button = document.createElement('button');
            button.textContent = deckKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            button.onclick = () => {
                this.soundManager.play('ui_click');
                this.elements.deckSelectionScreen.style.display = 'none';
                callback(deckKey);
            };
            this.elements.deckSelectionOptions.appendChild(button);
        }
        this.elements.deckSelectionScreen.style.display = 'flex';
    }

    showSwapScreen(aiPilesWithCharge, callback) {
        this.elements.pileSelectionContainer.innerHTML = '';
        aiPilesWithCharge.forEach((item, index) => {
            // Create a container for the pile and its info text
            const containerEl = document.createElement('div');
            containerEl.className = 'pile-container';

            // Create the pile element (it will get its emoji from CSS)
            const pileEl = document.createElement('div');
            pileEl.className = 'pile';

            // Create the info element for the charge text
            const chargeInfoEl = document.createElement('div');
            chargeInfoEl.className = 'pile-charge-info';
            const chargeText = item.charge > 0 ? `+${item.charge}` : item.charge;
            chargeInfoEl.innerHTML = `<span>⚡ Carga: ${chargeText}</span>`;

            // Append pile and info to the container
            containerEl.appendChild(pileEl);
            containerEl.appendChild(chargeInfoEl);

            // Make the entire container clickable
            containerEl.onclick = () => {
                this.soundManager.play('ui_click');
                this.elements.swapScreen.style.display = 'none';
                callback(index);
            };

            this.elements.pileSelectionContainer.appendChild(containerEl);
        });
        this.elements.swapScreen.style.display = 'flex';
    }
    
    showFlexibleCardModal(card, callback) {
        this.elements.flexibleCardTitle.textContent = `Escolha a Carga para ${card.name}`;
        this.elements.flexibleCardOptions.innerHTML = '';
        card.options.forEach(option => {
            const button = document.createElement('button');
            button.textContent = option > 0 ? `+${option}` : option;
            button.onclick = () => {
                this.soundManager.play('ui_click');
                this.elements.flexibleCardModal.style.display = 'none';
                callback(option);
            };
            this.elements.flexibleCardOptions.appendChild(button);
        });
        this.elements.flexibleCardModal.style.display = 'flex';
    }
    
    bindPlayerCardEvents(handler) {
        this.elements.player.hand.childNodes.forEach((cardEl, index) => {
            cardEl.addEventListener('click', () => handler(index));
            
            const cardData = handler.getCardData(index);
            cardEl.addEventListener('mouseenter', e => {
                this.soundManager.play('card_hover');
                clearTimeout(this.tooltipTimeout);
                this.elements.cardTooltip.textContent = cardData.name;
                this.elements.cardTooltip.style.left = `${e.clientX + 15}px`;
                this.elements.cardTooltip.style.top = `${e.clientY - 30}px`;
                this.elements.cardTooltip.style.opacity = '1';
            });
            cardEl.addEventListener('mouseleave', () => {
                this.tooltipTimeout = setTimeout(() => { this.elements.cardTooltip.style.opacity = '0'; }, 50);
            });
             cardEl.addEventListener('mousemove', e => {
                this.elements.cardTooltip.style.left = `${e.clientX + 15}px`;
                this.elements.cardTooltip.style.top = `${e.clientY - 30}px`;
            });
        });
    }

    resetUI() {
        this.elements.gameOverScreen.style.display = 'none';
        this.elements.startScreen.style.display = 'none';
        this.elements.deckSelectionScreen.style.display = 'none';
        this.elements.swapScreen.style.display = 'none';
        this.elements.info.log.innerHTML = '';
        this.clearReactionUI();
    }
}