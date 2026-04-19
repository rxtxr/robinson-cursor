(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))s(o);new MutationObserver(o=>{for(const i of o)if(i.type==="childList")for(const a of i.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&s(a)}).observe(document,{childList:!0,subtree:!0});function n(o){const i={};return o.integrity&&(i.integrity=o.integrity),o.referrerPolicy&&(i.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?i.credentials="include":o.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function s(o){if(o.ep)return;o.ep=!0;const i=n(o);fetch(o.href,i)}})();const b={adrenaline:{id:"adrenaline",name:"Adrenaline",cost:1,effect:{kind:"self_mod",stat:"tempo",delta:2,duration:1},description:"+2 Tempo this turn."},focus_poison:{id:"focus_poison",name:"Focus Poison",cost:1,effect:{kind:"force_action",mutationTag:"poison",bonus:4},description:"Next action uses poison, +4 to roll max."},focus_physical:{id:"focus_physical",name:"Focus Physical",cost:1,effect:{kind:"force_action",mutationTag:"physical",bonus:4},description:"Next action uses claws/horns, +4 to roll max."},tough:{id:"tough",name:"Tough",cost:1,effect:{kind:"self_mod",stat:"defense",delta:3,duration:1},description:"+3 Defense this turn."},bloodlust:{id:"bloodlust",name:"Bloodlust",cost:2,effect:{kind:"self_mod",stat:"attack",delta:4,duration:1},description:"+4 Attack this turn."},heal:{id:"heal",name:"Heal",cost:2,effect:{kind:"heal",amount:5},description:"+5 HP."},analyze:{id:"analyze",name:"Scan",cost:1,effect:{kind:"reveal"},description:"Reveal enemy's next action."},weakpoint:{id:"weakpoint",name:"Weak Point",cost:2,effect:{kind:"opponent_mod",stat:"defense",delta:-3,duration:2},description:"Enemy -3 Defense for 2 turns."},catalyst:{id:"catalyst",name:"Catalyst",cost:1,effect:{kind:"status_boost",chanceAdd:.5,uses:1},description:"+50% status chance on your next attack."},immunity:{id:"immunity",name:"Immunity",cost:1,effect:{kind:"status_immune",uses:1},description:"Block the next incoming status effect."},poison_arrow:{id:"poison_arrow",name:"Poison Dart",cost:2,effect:{kind:"force_action",mutationTag:"poison",bonus:6},description:"Forces poison attack, +6 to roll max."},paralysis:{id:"paralysis",name:"Paralyze",cost:2,effect:{kind:"skip_opponent_action",count:1},description:"Enemy skips 1 action."},strengthen:{id:"strengthen",name:"Empower Mutation",cost:1,effect:{kind:"self_mod",stat:"attack",delta:1,duration:99},description:"+1 level on a random own mutation for this fight (engine TODO)."},double_strike:{id:"double_strike",name:"Double Strike",cost:2,effect:{kind:"self_mod",stat:"tempo",delta:1,duration:1},description:"Repeats next action (engine TODO)."},aegis:{id:"aegis",name:"Aegis",cost:1,effect:{kind:"self_mod",stat:"defense",delta:99,duration:1},description:"Fully blocks the next attack."},tempo_boost:{id:"tempo_boost",name:"Haste",cost:0,effect:{kind:"self_mod",stat:"tempo",delta:1,duration:9999},description:"+1 Tempo permanently."},antidote:{id:"antidote",name:"Antidote",cost:2,effect:{kind:"cleanse"},description:"Remove all active status effects from self."},curse_poison_trail:{id:"curse_poison_trail",name:"Poison Trail",cost:0,curse:!0,effect:{kind:"heal",amount:-3},description:"[Curse] -3 HP on play. Left by the Stinger."},curse_heaviness:{id:"curse_heaviness",name:"Heaviness",cost:0,curse:!0,effect:{kind:"self_mod",stat:"tempo",delta:-2,duration:2},description:"[Curse] -2 Tempo for 2 turns. Left by the Bulwark."},curse_echo:{id:"curse_echo",name:"Echo",cost:0,curse:!0,effect:{kind:"self_mod",stat:"attack",delta:-3,duration:2},description:"[Curse] -3 Attack for 2 turns. Left by the Sparker."}},Le={stinger:"curse_poison_trail",bulwark:"curse_heaviness",sparker:"curse_echo"},_e=[{defId:"adrenaline",level:1},{defId:"adrenaline",level:1},{defId:"focus_poison",level:1},{defId:"focus_poison",level:1},{defId:"focus_physical",level:1},{defId:"focus_physical",level:1},{defId:"tough",level:1},{defId:"tough",level:1},{defId:"bloodlust",level:1},{defId:"heal",level:1},{defId:"analyze",level:1},{defId:"weakpoint",level:1},{defId:"catalyst",level:1},{defId:"immunity",level:1}],Ce=["poison_arrow","paralysis","strengthen","double_strike","aegis","tempo_boost","antidote"],Te={stinger:{id:"stinger",name:"Stinger",description:"Poison specialist. Spams DoTs, high hit chance.",mutations:[{id:"poison_gland",level:2},{id:"claws",level:2},{id:"keen_senses",level:1}]},bulwark:{id:"bulwark",name:"Bulwark",description:"Heavy tank. High defense, slow, hard-hitting.",mutations:[{id:"chitin_plate",level:2},{id:"horns",level:2},{id:"stone_skin",level:1}]},sparker:{id:"sparker",name:"Sparker",description:"Glass cannon. High tempo, low HP, pierces defense.",mutations:[{id:"electric_organ",level:2},{id:"wings",level:2},{id:"keen_senses",level:1}]}},ae=Object.values(Te);function Ne(e,t){const n=e.mutations.reduce((o,i)=>o+i.level,0);if(n===0||t<=0)return e;const s=t/n;return{...e,mutations:e.mutations.map(o=>({id:o.id,level:Math.max(1,Math.min(5,Math.round(o.level*s)))}))}}const Fe={stinger:["wings","fire_sac","horns"],bulwark:["fire_sac","electric_organ","poison_gland"],sparker:["claws","poison_gland","chitin_plate"]};function Oe(e,t){const n=Fe[e.id]??[];if(t<3||n.length===0)return e;const s=Math.min(n.length,1+Math.floor((t-3)/3)),o=Math.max(1,Math.min(5,1+Math.floor((t-3)/2))),i=[...e.mutations];for(let a=0;a<s;a++)i.some(r=>r.id===n[a])||i.push({id:n[a],level:o});return{...e,mutations:i}}const ne={claws:{id:"claws",name:"Claws",cost:2,slot:"front",statBonuses:{attack:3,tempo:1},action:{type:"physical",dice:{count:1,sides:6},description:"Fast strike with sharp claws (1d6)."},description:"Sharp, fast claws. +3 Attack, +1 Tempo per level. 1d6."},horns:{id:"horns",name:"Horns",cost:4,slot:"head",statBonuses:{attack:4,tempo:-1},action:{type:"physical",dice:{count:1,sides:12},description:"Heavy horn ram (1d12), 20% stun.",statusEffect:{kind:"stun",value:0,duration:1,chance:.2}},description:"Heavy horns. +4 Attack, -1 Tempo per level. 1d12 · 20% stun."},poison_gland:{id:"poison_gland",name:"Poison Gland",cost:5,slot:"body",statBonuses:{poison:3},action:{type:"poison",dice:{count:1,sides:4},description:"Venom bite (1d4), 75% poison (DoT 2/turn ×3).",statusEffect:{kind:"dot",value:2,duration:3,damageType:"poison",chance:.75}},description:"Injector for toxic secretions. +3 Poison per level. 1d4 · 75% DoT poison."},fire_sac:{id:"fire_sac",name:"Fire Sac",cost:5,slot:"body",statBonuses:{fire:3},action:{type:"fire",dice:{count:2,sides:6},description:"Fire blast (2d6), 40% burn (DoT 2/turn ×2).",statusEffect:{kind:"dot",value:2,duration:2,damageType:"fire",chance:.4}},description:"Combustible gland. +3 Fire per level. 2d6 · 40% burn DoT."},electric_organ:{id:"electric_organ",name:"Electric Organ",cost:6,slot:"body",statBonuses:{electric:3,tempo:1},action:{type:"electric",dice:{count:2,sides:4},description:"Shock (2d4)."},description:"Voltage generator. +3 Electric, +1 Tempo per level. 2d4. Strong vs physical."},leather_hide:{id:"leather_hide",name:"Leather Hide",cost:2,slot:"skin",statBonuses:{hp:4,defense:1},description:"Rugged skin. +4 HP, +1 Defense per level."},chitin_plate:{id:"chitin_plate",name:"Chitin Plate",cost:6,slot:"skin",statBonuses:{hp:6,defense:3,tempo:-1},description:"Hard carapace. +6 HP, +3 Defense, -1 Tempo per level. Blocks poison."},wings:{id:"wings",name:"Wings",cost:5,slot:"back",statBonuses:{tempo:2,attack:1},action:{type:"physical",dice:{count:1,sides:6},description:"Dive attack (1d6)."},description:"Leathery wings. +2 Tempo, +1 Attack per level. 1d6."},stone_skin:{id:"stone_skin",name:"Stone Skin",cost:5,slot:"skin",statBonuses:{hp:8,defense:2,tempo:-1},description:"Mineralized skin. +8 HP, +2 Defense, -1 Tempo per level. Grounds electric."},keen_senses:{id:"keen_senses",name:"Keen Senses",cost:3,slot:"head",statBonuses:{tempo:1},description:"Sharpened senses. +1 Tempo per level, +10% hit chance."},blade:{id:"blade",name:"Blade",cost:4,slot:"front",statBonuses:{attack:3},action:{type:"physical",dice:{count:1,sides:10},description:"Clean slice (1d10), 30% bleed (DoT 2/turn ×2).",statusEffect:{kind:"dot",value:2,duration:2,damageType:"physical",chance:.3}},description:"Sharp blade. +3 Attack per level. 1d10 · 30% bleed."},mace:{id:"mace",name:"Mace",cost:5,slot:"head",statBonuses:{attack:4,tempo:-1},action:{type:"physical",dice:{count:2,sides:6},description:"Heavy smash (2d6), 30% stun.",statusEffect:{kind:"stun",value:0,duration:1,chance:.3}},description:"Heavy weapon. +4 Attack, -1 Tempo per level. 2d6 · 30% stun."},invisibility:{id:"invisibility",name:"Invisibility",cost:6,slot:"skin",statBonuses:{},description:"Passive: chance to go invisible (untouchable) per attack. Lv1 20%, Lv5 60%."},magma_crust:{id:"magma_crust",name:"Magma Crust",cost:0,slot:"skin",statBonuses:{hp:10,defense:2,fire:2},isFusion:!0,fusionParents:["stone_skin","fire_sac"],description:"Passive: attacker takes 3 fire counter damage on hit."},venom_claws:{id:"venom_claws",name:"Venom Claws",cost:0,slot:"front",statBonuses:{attack:2,poison:2},action:{type:"physical",dice:{count:2,sides:6},description:"Physical strike (2d6), 85% poison.",statusEffect:{kind:"dot",value:2,duration:2,damageType:"poison",chance:.85}},isFusion:!0,fusionParents:["claws","poison_gland"],description:"Claws with venom channels. 2d6 · 85% DoT poison."},thunder_strike:{id:"thunder_strike",name:"Thunder Strike",cost:0,slot:"back",statBonuses:{electric:2,tempo:2},action:{type:"electric",dice:{count:1,sides:20},description:"Lightning dive (1d20), ignores 50% defense, 20% stun.",ignoreDefensePct:.5,statusEffect:{kind:"stun",value:0,duration:1,chance:.2}},isFusion:!0,fusionParents:["electric_organ","wings"],description:"Electrified dive. 1d20 · 50% def-pierce · 20% stun."}},je=Object.values(ne).filter(e=>!e.isFusion),Re=Object.values(ne).filter(e=>e.isFusion===!0);function v(e){const t=ne[e];if(!t)throw new Error(`Unknown mutation: ${e}`);return t}function K(e,t,n,s=Math.random){const o=[];for(const l of e.mutations){const d=v(l.id);if(!d.action)continue;const p=Ye(t,d.action.type);let u=l.level*(1+p*.2);n&&d.action.type===n&&(u=Number.POSITIVE_INFINITY),o.push({id:l.id,level:l.level,action:d.action,urge:u})}if(o.length===0)return null;const i=o.find(l=>l.urge===Number.POSITIVE_INFINITY);if(i)return{mutationId:i.id,action:i.action};const a=o.reduce((l,d)=>l+d.urge,0);if(a<=0){const l=o[0];return{mutationId:l.id,action:l.action}}let r=s()*a;for(const l of o)if(r-=l.urge,r<=0)return{mutationId:l.id,action:l.action};const c=o[o.length-1];return{mutationId:c.id,action:c.action}}function Ye(e,t){switch(t){case"poison":return e.poison;case"fire":return e.fire;case"electric":return e.electric;case"physical":return 0}}const Ue=["tough","bloodlust","adrenaline"];function qe(e,t=Math.random){if(t()>=.5)return null;const n=Ue.map(s=>b[s]).filter(s=>s.cost<=e.enemyEnergy);return n.length===0?null:n[Math.floor(t()*n.length)]}function Ve(e,t,n){t.cost>e.enemyEnergy||(e.enemyEnergy-=t.cost,t.effect.kind==="self_mod"?(n.turnModifiers.push({stat:t.effect.stat,delta:t.effect.delta,expiresIn:t.effect.duration}),e.log.push(`Enemy plays ${t.name}.`)):t.effect.kind==="heal"&&(n.currentHp+=t.effect.amount,e.log.push(`Enemy plays ${t.name} (+${t.effect.amount} HP).`)))}function re(e){const{attackerStats:t,defenderStats:n,defenderState:s,action:o,actionLevel:i,rollBonus:a=0}=e,r=`${o.dice.count}d${o.dice.sides}`,c=Math.floor(t.attack/2)+a+Math.floor((i-1)/2),l=s.mutations.find($=>$.id==="invisibility");if(l){const $=Math.min(.7,.1+l.level*.1);if(Math.random()<$)return{damage:0,statusEffects:[],note:`${o.description} — Miss (invisible)!`,rolls:[],diceSpec:r,modifier:c,rollTotal:0,missed:!0}}const d=[];for(let $=0;$<o.dice.count;$++)d.push(Qe(1,o.dice.sides));const u=d.reduce(($,y)=>$+y,0)+c,f=Ge(t,o.type),k=We(n);let w=ze(o.type,k);const L=J(s,"chitin_plate"),C=J(s,"stone_skin");o.type==="poison"&&L&&(w*=.5),o.type==="electric"&&C&&(w=.8),o.type==="fire"&&(L||C)&&(w*=1.5);const R=Math.floor(n.defense*(1-(o.ignoreDefensePct??0))),H=u*(1+f*.08)*w,N=Math.max(1,Math.round(H-R)),Y=o.statusEffect?[o.statusEffect]:[],U=Ze(o.type),F=c===0?"":c>0?`+${c}`:`${c}`,O=d.length>0?`[${d.join("+")}]`:"",q=w!==1?` ×${w.toFixed(2)}`:"",V=`🎲 ${r}${F} → ${O}${F}=${u} → ${N} ${U}${q}`;return{damage:N,statusEffects:Y,note:V,rolls:d,diceSpec:r,modifier:c,rollTotal:u,missed:!1}}function ce(e){return J(e,"magma_crust")?3:0}function Qe(e,t){return Math.floor(Math.random()*(t-e+1))+e}function Ge(e,t){switch(t){case"poison":return e.poison;case"fire":return e.fire;case"electric":return e.electric;case"physical":return 0}}function We(e){const{poison:t,fire:n,electric:s}=e,o=Math.max(t,n,s);return o<=0?"physical":t===o?"poison":n===o?"fire":"electric"}function ze(e,t){return e==="poison"&&t==="physical"?.75:e==="electric"&&t==="physical"?1.25:1}function J(e,t){return e.mutations.some(n=>n.id===t)}function Ze(e){return e==="poison"?"Poison":e==="fire"?"Fire":e==="electric"?"Electric":"Physical"}function Ke(){return{hp:30,attack:0,defense:0,tempo:1,poison:0,fire:0,electric:0,toughness:0}}function Z(e){const t=Ke();for(const n of e.mutations){const s=v(n.id);for(const[o,i]of Object.entries(s.statBonuses))t[o]+=i*n.level}return t.defense+=Math.floor(t.toughness*.5),t.tempo=Ee(t.tempo,1,3),t.hp=Math.max(1,t.hp),t}function S(e,t=e.turnModifiers){const n=Z(e);for(const s of t)n[s.stat]+=s.delta;return n.tempo=Ee(n.tempo,1,3),n.hp=Math.max(1,n.hp),n}function Ee(e,t,n){return Math.max(t,Math.min(n,e))}const Je=3,be=5,le=2;function Xe(e){const t=ut(e),n={mutations:t.mutations,currentHp:0,statusEffects:[],turnModifiers:[]};n.currentHp=S(n).hp,e.monster.currentHp=S(e.monster).hp,e.monster.statusEffects=[],e.monster.turnModifiers=[];const s=He([...e.deck.length?e.deck:_e]),o={enemy:n,enemyArchetype:t.id,turn:0,playerHand:[],playerDeck:s,playerDiscard:[],playerEnergy:0,enemyEnergy:0,log:[`Fight vs ${t.name} starts!`],subPhase:"draw"};return xe(o),o}function et(e,t,n){if(e.subPhase!=="cards")return!1;const s=e.playerHand[n];if(!s)return!1;const o=b[s.defId];return o.cost>e.playerEnergy?!1:(e.playerEnergy-=o.cost,e.playerHand.splice(n,1),e.playerDiscard.push(s),ct(e,t,o,s.level),e.log.push(`You play ${o.name}.`),!0)}function tt(e,t){if(e.subPhase!=="cards")return;const n=qe(e);n&&Ve(e,n,e.enemy);const s=S(t.monster),o=S(e.enemy),i=Math.max(1,Math.min(3,Math.floor(s.tempo))),a=Math.max(1,Math.min(3,Math.floor(o.tempo)));e.pendingActors=at(i,a),e.forceUsed=!1,e.subPhase="autobattle",e.log.push(`Auto-Battle: you ${i}× / enemy ${a}× (order: ${e.pendingActors.map(r=>r==="player"?"P":"E").join(" ")})`)}function nt(e,t){var a,r;if(!e.pendingActors||e.pendingActors.length===0)return{done:!0};const n=S(t.monster),s=S(e.enemy),o=e.pendingActors.shift(),i={done:!1,actor:o};if(o==="player")if(ue(t.monster))e.log.push("Your monster is stunned."),i.skipReason="stun";else{const c=e.forceUsed?void 0:e.playerForcedTag,l=e.forceUsed?0:e.playerForcedBonus??0;e.forceUsed=!0;const d=K(t.monster,n,c);if(!d)e.log.push("Your monster has no action available."),i.skipReason="no-action";else{const p=((a=t.monster.mutations.find(k=>k.id===d.mutationId))==null?void 0:a.level)??1,u=re({attackerStats:n,defenderStats:s,defenderState:e.enemy,action:d.action,actionLevel:p,rollBonus:l});e.enemy.currentHp-=u.damage,e.log.push(`You → ${v(d.mutationId).name}: ${u.note}`),i.mutationId=d.mutationId,i.mutationName=v(d.mutationId).name,i.actionType=d.action.type,i.damage=u.damage,i.defenderDefense=s.defense,i.diceSpec=u.diceSpec,i.rolls=u.rolls,i.modifier=u.modifier,i.rollTotal=u.rollTotal,i.missed=u.missed;for(const k of u.statusEffects)fe(e,k,e.enemy,"player",i);const f=ce(e.enemy);f>0&&u.damage>0&&(t.monster.currentHp-=f,e.log.push(`  Enemy Magma Crust triggers: ${f} fire`),i.counterDamage=f)}}else if((e.enemySkippedActions??0)>0)e.enemySkippedActions-=1,e.log.push("Enemy skips action (paralyzed)."),i.skipReason="paralysis";else if(ue(e.enemy))e.log.push("Enemy is stunned."),i.skipReason="stun";else{const c=K(e.enemy,s);if(!c)e.log.push("Enemy has no action."),i.skipReason="no-action";else{const l=((r=e.enemy.mutations.find(u=>u.id===c.mutationId))==null?void 0:r.level)??1,d=re({attackerStats:s,defenderStats:n,defenderState:t.monster,action:c.action,actionLevel:l});t.monster.currentHp-=d.damage,e.log.push(`Enemy → ${v(c.mutationId).name}: ${d.note}`),i.mutationId=c.mutationId,i.mutationName=v(c.mutationId).name,i.actionType=c.action.type,i.damage=d.damage,i.defenderDefense=n.defense,i.diceSpec=d.diceSpec,i.rolls=d.rolls,i.modifier=d.modifier,i.rollTotal=d.rollTotal,i.missed=d.missed;for(const u of d.statusEffects)fe(e,u,t.monster,"enemy",i);const p=ce(t.monster);p>0&&d.damage>0&&(e.enemy.currentHp-=p,e.log.push(`  Your Magma Crust triggers: ${p} fire`),i.counterDamage=p)}}return t.monster.currentHp<=0||e.enemy.currentHp<=0?(e.pendingActors=[],i.done=!0,i):(i.done=e.pendingActors.length===0,i)}function st(e,t){e.subPhase==="autobattle"&&(de(e,t)||(dt(e,t),!de(e,t)&&xe(e)))}function ot(e){return e.subPhase==="end"&&e.enemy.currentHp<=0}function it(e,t){return e.subPhase==="end"&&t.monster.currentHp<=0}function de(e,t){return t.monster.currentHp<=0?(e.subPhase="end",e.log.push("Your monster has fallen."),!0):e.enemy.currentHp<=0?(e.subPhase="end",e.log.push("Enemy defeated!"),!0):!1}function at(e,t){let n=e>t||e===t&&Math.random()<.5;const s=[];let o=e,i=t;for(;o>0||i>0;){let a;o===0?a="enemy":i===0?a="player":a=n?"player":"enemy",n=a==="enemy",s.push(a),a==="player"?o--:i--}return s}function xe(e){for(e.turn+=1,e.subPhase="draw",e.playerEnergy=le,e.enemyEnergy=le;e.playerHand.length<Je&&e.playerHand.length<be;){const t=rt(e);if(!t)break;e.playerHand.push(t)}e.subPhase="cards",e.log.push(`— Turn ${e.turn} —`),e.playerForcedTag=void 0,e.playerForcedBonus=0,e.enemySkippedActions=0,e.revealedEnemyAction=void 0,e.forceUsed=!1,e.pendingActors=[]}function rt(e){if(e.playerDeck.length===0){if(e.playerDiscard.length===0)return null;e.playerDeck=He(e.playerDiscard),e.playerDiscard=[]}return e.playerDeck.pop()??null}function ct(e,t,n,s){const o=s-1;switch(n.effect.kind){case"self_mod":t.monster.turnModifiers.push({stat:n.effect.stat,delta:n.effect.delta+(n.effect.delta>0?o:-o),expiresIn:n.effect.duration});return;case"opponent_mod":e.enemy.turnModifiers.push({stat:n.effect.stat,delta:n.effect.delta-(n.effect.delta<0?o:0),expiresIn:n.effect.duration});return;case"heal":{const i=S(t.monster).hp;t.monster.currentHp=Math.min(i,t.monster.currentHp+n.effect.amount+o);return}case"force_action":e.playerForcedTag=n.effect.mutationTag,e.playerForcedBonus=n.effect.bonus??0;return;case"reveal":{const i=K(e.enemy,S(e.enemy));e.revealedEnemyAction=i?`${v(i.mutationId).name}: ${i.action.description}`:"no action available",e.log.push(`Scan: enemy plans → ${e.revealedEnemyAction}`);return}case"skip_opponent_action":e.enemySkippedActions=(e.enemySkippedActions??0)+n.effect.count;return;case"status_boost":{const i=e.playerStatusBoost;i?e.playerStatusBoost={chanceAdd:Math.max(i.chanceAdd,n.effect.chanceAdd),uses:i.uses+n.effect.uses}:e.playerStatusBoost={chanceAdd:n.effect.chanceAdd,uses:n.effect.uses};return}case"status_immune":e.playerStatusImmune=(e.playerStatusImmune??0)+n.effect.uses;return;case"cleanse":t.monster.statusEffects.length===0?e.log.push("Antidote: no effects to remove."):e.log.push(`Antidote removes ${t.monster.statusEffects.length} status effect(s).`),t.monster.statusEffects=[];return}}function ue(e){return e.statusEffects.some(t=>t.kind==="stun"&&t.remainingTurns>0)}function fe(e,t,n,s,o){let i=t.chance??1,a=!1;s==="player"&&e.playerStatusBoost&&e.playerStatusBoost.uses>0&&(i=Math.min(1,i+e.playerStatusBoost.chanceAdd),e.playerStatusBoost.uses-=1,a=!0,e.playerStatusBoost.uses<=0&&(e.playerStatusBoost=void 0));const r=lt(t),c=Math.round(i*100);if(o.statusLabel=r,o.statusChance=i,Math.random()>=i){e.log.push(`  → ${r} misses (chance ${c}%${a?", boosted":""}).`),o.statusApplied=!1;return}if(s==="enemy"&&(e.playerStatusImmune??0)>0){e.playerStatusImmune=(e.playerStatusImmune??0)-1,e.log.push(`  → ${r} blocked (immunity).`),o.statusApplied=!1,o.statusBlocked=!0;return}n.statusEffects.push({kind:t.kind,value:t.value,remainingTurns:t.duration,...t.damageType?{damageType:t.damageType}:{}}),e.log.push(`  → ${r} lands (${c}%${a?", boosted":""}).`),o.statusApplied=!0}function lt(e){if(e.kind==="stun")return"Stun";if(e.kind==="debuff")return`Debuff ${e.value}`;switch(e.damageType){case"poison":return"Poison";case"fire":return"Burn";case"physical":return"Bleed";case"electric":return"Overload";default:return"DoT"}}function dt(e,t){for(pe(t.monster,e.log,"Your monster"),pe(e.enemy,e.log,"Enemy");e.playerHand.length>be;){const n=e.playerHand.shift();n&&e.playerDiscard.push(n)}}function pe(e,t,n){for(const s of e.statusEffects)s.kind==="dot"&&s.remainingTurns>0&&(e.currentHp-=s.value,t.push(`${n} takes ${s.value} ${s.damageType??""} (DoT).`)),s.remainingTurns-=1;e.statusEffects=e.statusEffects.filter(s=>s.remainingTurns>0);for(const s of e.turnModifiers)s.expiresIn-=1;e.turnModifiers=e.turnModifiers.filter(s=>s.expiresIn>0)}function He(e){const t=[...e];for(let n=t.length-1;n>0;n--){const s=Math.floor(Math.random()*(n+1));[t[n],t[s]]=[t[s],t[n]]}return t}function ut(e){const t=e.monster.mutations.reduce((a,r)=>a+r.level,0),n=e.battlesWon,s=ae[Math.floor(Math.random()*ae.length)],o=Math.max(3,t)+Math.ceil(n/2),i=Ne(Te[s.id],o);return Oe(i,n)}function me(e){return S(e).hp}function he(e){return S(e)}function D(e){return 1+(e-1)*.2}function ye(e){return`
    <ellipse cx="100" cy="120" rx="60" ry="45" fill="${e}" stroke="#000" stroke-width="2"/>
    <ellipse cx="100" cy="85" rx="35" ry="30" fill="${e}" stroke="#000" stroke-width="2"/>
    <circle cx="88" cy="80" r="4" fill="#fff"/>
    <circle cx="112" cy="80" r="4" fill="#fff"/>
    <circle cx="88" cy="80" r="2" fill="#000"/>
    <circle cx="112" cy="80" r="2" fill="#000"/>
  `}const ft=e=>{const t=D(e),n=Math.min(4,2+Math.floor((e-1)/2)),s=[];for(let o=0;o<n;o++){const i=40+o*8,a=12*t;s.push(`<path d="M${i} 140 L${i-4} ${140+a} L${i+4} ${140+a-2} Z" fill="#e8e8ec" stroke="#000" stroke-width="1.5"/>`)}return s.join("")},pt=e=>{const t=D(e),n=Math.min(4,2+Math.floor((e-1)/2)),s=[];for(let o=0;o<n;o++){const i=40+o*8,a=13*t;s.push(`<path d="M${i} 140 L${i-4} ${140+a} L${i+4} ${140+a-2} Z" fill="#8de08d" stroke="#000" stroke-width="1.5"/>`,`<circle cx="${i}" cy="${140+a-3}" r="1.5" fill="#4a7a4a"/>`)}return s.join("")},mt=e=>{const n=20*D(e);return`
    <path d="M80 60 Q75 ${60-n} 70 ${60-n+5}" stroke="#d8cfb6" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M120 60 Q125 ${60-n} 130 ${60-n+5}" stroke="#d8cfb6" stroke-width="5" fill="none" stroke-linecap="round"/>
  `},ht=e=>{const t=2+e*.5;return`
    <circle cx="88" cy="80" r="${t}" fill="#ffe066" opacity="0.7"/>
    <circle cx="112" cy="80" r="${t}" fill="#ffe066" opacity="0.7"/>
    <path d="M70 70 L78 74" stroke="#ffe066" stroke-width="1.5"/>
    <path d="M130 70 L122 74" stroke="#ffe066" stroke-width="1.5"/>
  `},yt=e=>{const t=5+e;return`
    <circle cx="100" cy="120" r="${t}" fill="#7ee787" stroke="#2f6a2f" stroke-width="1.5" opacity="0.85"/>
    <circle cx="95" cy="115" r="${t*.3}" fill="#c5f0c5" opacity="0.8"/>
  `},gt=e=>{const t=5+e;return`
    <circle cx="100" cy="125" r="${t}" fill="#ff8552" stroke="#7a2f0f" stroke-width="1.5" opacity="0.9"/>
    <circle cx="96" cy="120" r="${t*.3}" fill="#ffd6a5" opacity="0.8"/>
  `},kt=e=>{const t=D(e);return`
    <path d="M100 110 L90 125 L100 128 L95 140" stroke="#ffe066" stroke-width="${2*t}" fill="none" stroke-linecap="round"/>
    <path d="M108 115 L115 125 L108 130" stroke="#ffe066" stroke-width="${1.5*t}" fill="none" stroke-linecap="round"/>
  `},vt=e=>`
    <ellipse cx="100" cy="120" rx="60" ry="45" fill="#5a3a24" opacity="${.2+e*.08}"/>
    <path d="M60 105 Q80 100 100 105 M100 105 Q120 100 140 105" stroke="#3a2410" stroke-width="1" fill="none" opacity="0.6"/>
  `,$t=e=>{const t=[],n=Math.min(6,3+e);for(let s=0;s<n;s++){const o=60+s*80/n;t.push(`<path d="M${o} 105 Q${o+12} 100 ${o+20} 110" stroke="#6b5b3c" stroke-width="2" fill="#8f7d56" opacity="0.9"/>`)}return`
    ${t.join("")}
    <path d="M60 140 L160 140" stroke="#6b5b3c" stroke-width="1" opacity="0.5"/>
  `},Mt=e=>{const t=[],n=4+e;for(let s=0;s<n;s++){const o=s/n*Math.PI*2,i=100+Math.cos(o)*55,a=115+Math.sin(o)*40,r=4+Math.random()*2;t.push(`<circle cx="${i.toFixed(1)}" cy="${a.toFixed(1)}" r="${r.toFixed(1)}" fill="#8a8a8a" stroke="#4a4a4a" stroke-width="1"/>`)}return t.join("")},St=e=>{const t=D(e);return`
    <path d="M60 90 Q30 60 ${25-5*t} ${100+10*t} Q50 100 60 110 Z" fill="#3a3f55" stroke="#1a1f35" stroke-width="1.5" opacity="0.9"/>
    <path d="M140 90 Q170 60 ${175+5*t} ${100+10*t} Q150 100 140 110 Z" fill="#3a3f55" stroke="#1a1f35" stroke-width="1.5" opacity="0.9"/>
  `},wt=e=>{const t=D(e);return`
    <path d="M55 85 Q25 55 ${20-5*t} ${105+10*t} Q45 95 58 108 Z" fill="#4a55ff" stroke="#0a1055" stroke-width="1.5" opacity="0.9"/>
    <path d="M145 85 Q175 55 ${180+5*t} ${105+10*t} Q155 95 142 108 Z" fill="#4a55ff" stroke="#0a1055" stroke-width="1.5" opacity="0.9"/>
    <path d="M100 60 L95 75 L105 75 L95 95" stroke="#ffe066" stroke-width="2.5" fill="none"/>
  `},_t=e=>{const t=[],n=3+e;for(let s=0;s<n;s++){const o=s/n*Math.PI*2,i=100+Math.cos(o)*40,a=115+Math.sin(o)*30,r=100+Math.cos(o)*58,c=115+Math.sin(o)*43;t.push(`<path d="M${i.toFixed(1)} ${a.toFixed(1)} L${r.toFixed(1)} ${c.toFixed(1)}" stroke="#ff5522" stroke-width="2" opacity="0.85"/>`)}return t.join("")},ge={claws:ft,horns:mt,poison_gland:yt,fire_sac:gt,electric_organ:kt,leather_hide:vt,chitin_plate:$t,wings:St,stone_skin:Mt,keen_senses:ht,magma_crust:_t,venom_claws:pt,thunder_strike:wt};function se(e){if(e.mutations.length===0)return ke(ye("#5a5a66"));const t=Z(e),n=Tt(t),s=new Map,o=[];for(const r of e.mutations){const c=v(r.id);if(c.isFusion){o.push({id:r.id,level:r.level});continue}const l=s.get(c.slot);(!l||l.cost<c.cost)&&s.set(c.slot,{id:r.id,level:r.level,cost:c.cost})}const i=["skin","back","body","head","front"],a=[ye(n)];for(const r of i){const c=s.get(r);if(!c)continue;const l=ge[c.id];l&&a.push(l(c.level))}for(const r of o){const c=ge[r.id];c&&a.push(c(r.level))}return ke(a.join(`
`))}function ke(e){return`<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" class="monster-svg">${e}</svg>`}function Tt(e){const{poison:t,fire:n,electric:s}=e,o=Math.max(t,n,s);return o<=0?"#7a7a84":t===o?"#4a8a4a":n===o?"#c24a2a":"#d4a835"}const oe="mutagen.state.v1";function Et(e){try{localStorage.setItem(oe,JSON.stringify(e))}catch{}}function bt(){try{const e=localStorage.getItem(oe);return e?JSON.parse(e):null}catch{return null}}function Pe(){try{localStorage.removeItem(oe)}catch{}}const xt=bt()??{phase:"menu"};let I=xt;const X=new Set;function x(){return I}function Ht(e){return X.add(e),e(I),()=>X.delete(e)}function m(e){I=e(I),Et(I);for(const t of X)t(I)}function Pt(){m(()=>({phase:"menu"}))}function ie(e,t){const n=(o,i,a)=>`<div class="stat-row" data-stat="${a}"><span class="stat-label">${o}</span><span class="stat-value">${i}</span></div>`,s=t!==void 0?`${t} / ${e.hp}`:`${e.hp}`;return`
    <div class="stat-block">
      ${n("HP",s,"hp")}
      ${n("Attack",e.attack,"attack")}
      ${n("Defense",e.defense,"defense")}
      ${n("Tempo",e.tempo,"tempo")}
      ${e.poison?n("Poison",e.poison,"poison"):""}
      ${e.fire?n("Fire",e.fire,"fire"):""}
      ${e.electric?n("Electric",e.electric,"electric"):""}
    </div>
  `}function At(e,t){return`
    <div class="hp-bar">
      <div class="hp-fill" style="width:${Math.max(0,Math.min(100,e/t*100))}%"></div>
      <div class="hp-label">${Math.max(0,e)} / ${t}</div>
    </div>
  `}const Ae=900;let M=null,G=null,W=null,ve=null,h=null,j=0;function It(e){const t=x();if(!t.player){m(()=>({phase:"menu"}));return}if(!t.battle){const n=Xe(t.player);ee(),m(s=>({...s,battle:n}));return}ve!==t.battle&&(ee(),ve=t.battle),Bt(e,t)}function ee(){G=null,W=null,h=null,M!==null&&(clearTimeout(M),M=null)}function Bt(e,t){var q,V,$;const{player:n,battle:s}=t,o=he(n.monster),i=he(s.enemy),a=me(n.monster),r=me(s.enemy),c=G!==null&&n.monster.currentHp<G,l=W!==null&&s.enemy.currentHp<W;if(G=n.monster.currentHp,W=s.enemy.currentHp,s.subPhase==="end"){const y=ot(s),_=it(s,n);e.innerHTML=`
      <div class="screen battle ended">
        <h2>${y?"Victory!":_?"Defeat":"Battle End"}</h2>
        <div class="log">${Me(s.log)}</div>
        <button id="btn-next">${y?"Continue to Level-Up":"To Game Over"}</button>
      </div>
    `,e.querySelector("#btn-next").onclick=()=>{if(ee(),y){const T=Le[s.enemyArchetype];m(E=>({...E,phase:"levelup",player:{...E.player,skillPoints:E.player.skillPoints+1,battlesWon:E.player.battlesWon+1,deck:T?[...E.player.deck,{defId:T,level:1}]:E.player.deck,pendingCurseNotice:T},battle:void 0}))}else m(T=>({...T,phase:"gameover",battle:void 0}))};return}const d=s.subPhase==="autobattle",p=(q=s.pendingActors)==null?void 0:q[0],u=d&&h&&h.actor&&(h.damage!==void 0||h.missed),f=u?h.actor:null,k=f==="player"?"enemy":f==="enemy"?"player":null,w=u?h.actionType:null,L=u?h.mutationName:null,C=u?h.damage:null,R=u?h.counterDamage:null,H=u?!!h.missed:!1,N=u?h.diceSpec??"":"",Y=u?h.rolls??[]:[],U=u?h.modifier??0:0,F=u?h.rollTotal??0:0;if(e.innerHTML=`
    <div class="screen battle">
      <header>
        <h2>Turn ${s.turn} — vs ${Se(s.enemyArchetype)}</h2>
        <div class="phase-badge">${Lt(s.subPhase)}</div>
      </header>
      <div class="battle-grid">
        ${$e({side:"player",label:"You",mName:n.monster,stats:o,maxHpVal:a,damagedClass:c?"damage-flash":"",activeNext:d&&p==="player",isAttacker:f==="player"&&!H,isDefender:k==="player",attackType:f==="player"?w:null,attackName:f==="player"?L:null,incomingDamage:k==="player"?C:null,counterDamage:f==="player"?R:null,diceSpec:f==="player"?N:"",rolls:f==="player"?Y:[],modifier:f==="player"?U:0,rollTotal:f==="player"?F:0,showMissOverDefender:k==="player"&&H})}
        ${$e({side:"enemy",label:`Enemy (${Se(s.enemyArchetype)})`,mName:s.enemy,stats:i,maxHpVal:r,damagedClass:l?"damage-flash":"",activeNext:d&&p==="enemy",isAttacker:f==="enemy"&&!H,isDefender:k==="enemy",attackType:f==="enemy"?w:null,attackName:f==="enemy"?L:null,incomingDamage:k==="enemy"?C:null,counterDamage:f==="enemy"?R:null,diceSpec:f==="enemy"?N:"",rolls:f==="enemy"?Y:[],modifier:f==="enemy"?U:0,rollTotal:f==="enemy"?F:0,showMissOverDefender:k==="enemy"&&H})}
      </div>
      <section class="cards-row ${d?"locked":""}">
        <div class="row">
          <div class="energy">Energy: <strong>${s.playerEnergy}</strong></div>
          ${d?'<div class="autobattle-status">⚡ Auto-Battle running…</div>':'<button id="btn-end-turn">Start Auto-Battle</button>'}
        </div>
        <div class="hand">
          ${s.playerHand.map((y,_)=>Nt(y.defId,y.level,_,s.playerEnergy,d)).join("")}
        </div>
      </section>
      <section class="log-section">
        <h4>Log</h4>
        <div class="log">${Me(s.log)}</div>
      </section>
    </div>
  `,d)M===null&&(((V=s.pendingActors)==null?void 0:V.length)??0)>0?te():((($=s.pendingActors)==null?void 0:$.length)??0)===0&&M===null&&(M=window.setTimeout(()=>{M=null,st(s,n),m(y=>({...y,player:n,battle:{...s}}))},Ae));else{e.querySelectorAll(".card").forEach(_=>{_.classList.contains("unplayable")||(_.onclick=()=>{const T=Number(_.dataset.idx);et(s,n,T)&&m(De=>({...De,player:n,battle:{...s}}))})});const y=e.querySelector("#btn-end-turn");y&&(y.onclick=()=>{tt(s,n),h=null,m(_=>({..._,player:n,battle:{...s}})),te()})}const O=e.querySelector(".log-section .log");O&&(O.scrollTop=O.scrollHeight)}function te(){M===null&&(M=window.setTimeout(()=>{M=null;const e=x();if(!e.player||!e.battle||e.battle.subPhase!=="autobattle")return;const t=nt(e.battle,e.player);h=t,j+=1,m(n=>({...n,player:e.player,battle:{...e.battle}})),t.done||te()},Ae))}function $e(e){const t=e.isAttacker?`attacking attacking-${e.attackType??"physical"}`:"",n=e.isDefender?"defending":"",s=e.isDefender&&e.incomingDamage!==void 0&&e.incomingDamage!==null?`<div class="damage-float" data-stamp="${j}">-${e.incomingDamage}</div>`:"",o=e.showMissOverDefender?`<div class="miss-float" data-stamp="${j}">Miss!</div>`:"",i=e.counterDamage?`<div class="damage-float counter" data-stamp="${j}">-${e.counterDamage}</div>`:"";let a="";if(e.isAttacker&&e.attackName){const c=e.modifier===0?"":e.modifier>0?`+${e.modifier}`:`${e.modifier}`,l=e.rolls.length>0?`[${e.rolls.join("+")}]${c}=${e.rollTotal}`:"";a=`
      <div class="active-mutation-badge type-${e.attackType??"physical"}" data-stamp="${j}">
        <span class="badge-title">${Dt(e.attackType)} ${e.attackName}</span>
        ${e.diceSpec?`<span class="badge-dice">🎲 ${e.diceSpec}${c}</span>`:""}
        ${l?`<span class="badge-result">${l}</span>`:""}
      </div>
    `}return`
    <section class="${["side",e.side,e.damagedClass,e.activeNext?"active":"",t,n].filter(Boolean).join(" ")}">
      <h3>${e.label}</h3>
      <div class="monster-frame">
        ${se(e.mName)}
        ${a}
        ${s}
        ${o}
        ${i}
      </div>
      ${At(e.mName.currentHp,e.maxHpVal)}
      ${Ct(e.stats.tempo,e.side)}
      ${ie(e.stats,e.mName.currentHp)}
      <div class="statuses">${Ft(e.mName.statusEffects)}</div>
    </section>
  `}function Dt(e){switch(e){case"poison":return"☣";case"fire":return"🔥";case"electric":return"⚡";case"physical":return"⚔";default:return"•"}}function Lt(e){switch(e){case"draw":return"Draw";case"cards":return"Play Cards";case"autobattle":return"Auto-Battle";case"end":return"End"}}function Ct(e,t){var c;const n=Math.max(1,Math.min(3,Math.floor(e))),o=x().battle,i=((c=o==null?void 0:o.pendingActors)==null?void 0:c.filter(l=>l===t).length)??0,a=n-i;return`
    <div class="tempo-row">
      <span class="tempo-label">Actions:</span>
      <span class="tempo-dots">${Array.from({length:n},(l,d)=>`<span class="tempo-dot ${(o==null?void 0:o.subPhase)==="autobattle"?d<a?"done":"pending":"idle"}"></span>`).join("")}</span>
      <span class="tempo-num">${n}</span>
    </div>
  `}function Nt(e,t,n,s,o){const i=b[e];return`
    <div class="card ${!o&&i.cost<=s?"":"unplayable"} ${i.curse?"curse":""}" data-idx="${n}">
      <div class="card-head">
        <span>${i.name}${t>1?` Lv${t}`:""}</span>
        <span class="card-cost">${i.cost}</span>
      </div>
      <div class="card-body">${i.description}</div>
    </div>
  `}function Ft(e){return e.length===0?'<span class="muted">(no effects)</span>':e.map(t=>`<span class="status-chip ${t.kind}">${Ot(t)} · ${t.remainingTurns}t</span>`).join("")}function Ot(e){return e.kind==="dot"?`DoT ${e.value}${e.damageType?" "+e.damageType:""}`:e.kind==="debuff"?`Debuff ${e.value}`:"Stun"}function Me(e){return e.map(t=>`<div class="log-line">${jt(t)}</div>`).join("")}function jt(e){return e.replace(/[&<>"']/g,t=>t==="&"?"&amp;":t==="<"?"&lt;":t===">"?"&gt;":t==='"'?"&quot;":"&#39;")}function Se(e){return e[0].toUpperCase()+e.slice(1)}const Q=15;let g=new Set;function Rt(e){g.size===0&&(g=new Set),Ie(e)}function Ie(e){const t={mutations:[...g].map(a=>({id:a,level:1}))},n=Z(t),s=[...g].reduce((a,r)=>a+v(r).cost,0),o=s>Q,i=g.size>0&&!o;e.innerHTML=`
    <div class="screen creation">
      <header>
        <h2>Build Your Monster</h2>
        <button id="btn-back-menu" class="ghost">← Menu</button>
      </header>
      <div class="creation-grid">
        <section class="catalog">
          <h3>Mutations</h3>
          <ul class="mutation-list">
            ${je.map(a=>{const r=a.action?`<span class="m-dice">🎲 ${a.action.dice.count}d${a.action.dice.sides}</span>`:'<span class="m-passive">passive</span>';return`
              <li class="mutation-item ${g.has(a.id)?"selected":""} ${!g.has(a.id)&&s+a.cost>Q?"too-expensive":""}"
                  data-id="${a.id}">
                <div class="m-head">
                  <span class="m-name">${a.name}</span>
                  ${r}
                  <span class="m-cost">${a.cost}</span>
                </div>
                <div class="m-desc">${a.description??""}</div>
              </li>`}).join("")}
          </ul>
        </section>
        <section class="preview">
          <h3>Preview</h3>
          <div class="monster-frame">${se(t)}</div>
          ${ie(n,n.hp)}
          <div class="budget ${o?"over":""}">Budget: ${s} / ${Q}</div>
          <button id="btn-confirm" ${i?"":"disabled"}>Start Battle</button>
        </section>
      </div>
    </div>
  `,e.querySelectorAll(".mutation-item").forEach(a=>{a.onclick=()=>{const r=a.dataset.id;if(g.has(r))g.delete(r);else{if(s+v(r).cost>Q)return;g.add(r)}Ie(e)}}),e.querySelector("#btn-back-menu").onclick=()=>{g.clear(),m(()=>({phase:"menu"}))},e.querySelector("#btn-confirm").onclick=()=>{if(!i)return;const a={mutations:[...g].map(r=>({id:r,level:1})),currentHp:n.hp,statusEffects:[],turnModifiers:[]};g.clear(),m(()=>({phase:"battle",player:{monster:a,deck:[..._e],skillPoints:0,battlesWon:0},battle:void 0}))}}function Yt(e){var n;const t=((n=x().player)==null?void 0:n.battlesWon)??0;e.innerHTML=`
    <div class="screen gameover">
      <h2>Game Over</h2>
      <p>Your monster fell after ${t} ${t===1?"win":"wins"}.</p>
      <button id="btn-new">New Monster</button>
    </div>
  `,e.querySelector("#btn-new").onclick=()=>{Pe(),m(()=>({phase:"creation"}))}}let z=null,P=null,B=[];function Ut(e){const t=x();if(!t.player){m(()=>({phase:"menu"}));return}if(!z&&(z=Vt(),B=Qt(t.player.monster),B.length>0)){m(n=>{if(!n.player)return n;const s={...n.player,monster:{...n.player.monster}};for(const o of B)s.monster.mutations.some(i=>i.id===o)||(s.monster.mutations=[...s.monster.mutations,{id:o,level:1}]);return{...n,player:s}});return}Be(e)}function Be(e){const t=x();if(!t.player)return;const n=t.player,s=Z(n.monster),o=B.length>0?`<div class="banner success">Fusion unlocked: ${B.map(r=>v(r).name).join(", ")}!</div>`:"",i=qt(n.pendingCurseNotice),a=`${o}${i}`;e.innerHTML=`
    <div class="screen levelup">
      <header><h2>Level-Up</h2></header>
      ${a}
      <div class="levelup-grid">
        <section>
          <h3>Your Monster</h3>
          <div class="monster-frame">${se(n.monster)}</div>
          ${ie(s,n.monster.currentHp)}
          <div class="skillpoints">Skill Points: <strong>${n.skillPoints}</strong></div>
        </section>
        <section>
          <h3>Mutations</h3>
          <ul class="mutation-list">
            ${n.monster.mutations.map(r=>`
                <li class="mutation-item">
                  <div class="m-head">
                    <span class="m-name">${v(r.id).name}</span>
                    <span class="m-level">Lv ${r.level} / 5</span>
                  </div>
                  <button class="level-btn" data-id="${r.id}"
                    ${r.level>=5||n.skillPoints<=0?"disabled":""}>
                    +1 Level
                  </button>
                </li>`).join("")}
          </ul>
        </section>
        <section>
          <h3>Pick a Card</h3>
          <div class="card-choices">
            ${z.map(r=>`
                <div class="card ${P===r?"chosen":""}" data-card="${r}">
                  <div class="card-head">
                    <span>${b[r].name}</span>
                    <span class="card-cost">${b[r].cost}</span>
                  </div>
                  <div class="card-body">${b[r].description}</div>
                </div>`).join("")}
          </div>
        </section>
      </div>
      <div class="levelup-footer">
        <button id="btn-continue" ${P?"":"disabled"}>Back to Main Menu</button>
      </div>
    </div>
  `,e.querySelectorAll(".level-btn").forEach(r=>{r.onclick=()=>{const c=r.dataset.id;m(l=>{if(!l.player||l.player.skillPoints<=0)return l;const d={...l.player,skillPoints:l.player.skillPoints-1,monster:{...l.player.monster,mutations:l.player.monster.mutations.map(p=>p.id===c&&p.level<5?{...p,level:p.level+1}:p)}};return{...l,player:d}})}}),e.querySelectorAll("[data-card]").forEach(r=>{r.onclick=()=>{P=r.dataset.card,Be(e)}}),e.querySelector("#btn-continue").onclick=()=>{if(!P)return;const r=P;m(c=>{if(!c.player)return c;const l={...c.player,deck:[...c.player.deck,{defId:r,level:1}],pendingCurseNotice:void 0};return{...c,phase:"menu",player:l,battle:void 0}}),z=null,P=null,B=[]}}function qt(e){if(!e)return"";const t=b[e];return t?`
    <div class="banner curse">
      ⚠ The defeated enemy slips a curse into your deck:
      <strong>${t.name}</strong> — <span class="muted">${t.description}</span>
    </div>
  `:""}function Vt(){const e=[...Ce],t=[];for(let n=0;n<3&&e.length>0;n++){const s=Math.floor(Math.random()*e.length);t.push(e.splice(s,1)[0])}return t}function Qt(e){const t=new Map(e.mutations.map(s=>[s.id,s.level])),n=[];for(const s of Re){if(!s.fusionParents)continue;const[o,i]=s.fusionParents,a=t.get(o)??0,r=t.get(i)??0;a>=3&&r>=3&&!t.has(s.id)&&n.push(s.id)}return n}function Gt(e){var o;const t=x(),n=!!t.player,s=((o=t.player)==null?void 0:o.battlesWon)??0;e.innerHTML=`
    <div class="menu">
      <h1>Mutagen</h1>
      <p class="subtitle">Build a monster. Fight. Survive.</p>
      <div class="menu-buttons">
        <button id="btn-new">New Game</button>
        <button id="btn-continue" ${n?"":"disabled"}>
          Continue ${n?`(${s} ${s===1?"win":"wins"})`:""}
        </button>
      </div>
    </div>
  `,e.querySelector("#btn-new").onclick=()=>{Pe(),m(()=>({phase:"creation"}))},e.querySelector("#btn-continue").onclick=()=>{n&&(t.battle?m(i=>({...i,phase:"battle"})):m(i=>({...i,phase:"battle",battle:void 0})))}}const A=document.getElementById("app");if(!A)throw new Error("#app container missing in index.html");Ht(e=>{switch(e.phase){case"menu":return Gt(A);case"creation":return Rt(A);case"battle":return It(A);case"levelup":return Ut(A);case"gameover":return Yt(A)}});const we=document.getElementById("global-restart");we&&(we.onclick=()=>{confirm("Discard current run and restart?")&&Pt()});
