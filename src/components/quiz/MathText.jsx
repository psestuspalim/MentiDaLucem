import React from 'react';

export default function MathText({ text }) {
  if (!text) return null;

  // Procesar texto con LaTeX inline ($...$) y display ($$...$$)
  const processText = (inputText) => {
    const parts = [];
    let remainingText = inputText;
    let key = 0;

    // Procesar fórmulas inline y display
    const regex = /(\$\$[\s\S]+?\$\$|\$[^$]+?\$)/g;
    let match;
    let lastIndex = 0;

    while ((match = regex.exec(inputText)) !== null) {
      // Agregar texto antes de la fórmula
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${key++}`}>
            {inputText.substring(lastIndex, match.index)}
          </span>
        );
      }

      // Agregar fórmula
      const formula = match[0];
      const isDisplay = formula.startsWith('$$');
      const content = isDisplay 
        ? formula.slice(2, -2).trim() 
        : formula.slice(1, -1).trim();

      parts.push(
        <span
          key={`math-${key++}`}
          className={`math-formula ${isDisplay ? 'block my-2' : 'inline'}`}
          style={{
            fontFamily: 'serif',
            fontStyle: 'italic',
            color: '#1e40af',
            fontSize: isDisplay ? '1.1em' : '1em',
            display: isDisplay ? 'block' : 'inline',
            textAlign: isDisplay ? 'center' : 'inherit'
          }}
          dangerouslySetInnerHTML={{ __html: formatMath(content) }}
        />
      );

      lastIndex = regex.lastIndex;
    }

    // Agregar texto restante
    if (lastIndex < inputText.length) {
      parts.push(
        <span key={`text-${key++}`}>
          {inputText.substring(lastIndex)}
        </span>
      );
    }

    return parts.length > 0 ? parts : inputText;
  };

  // Formatear expresiones matemáticas a HTML
  const formatMath = (latex) => {
    let formatted = latex;

    // Símbolos griegos comunes
    const greekLetters = {
      'alpha': 'α', 'beta': 'β', 'gamma': 'γ', 'delta': 'δ',
      'epsilon': 'ε', 'zeta': 'ζ', 'eta': 'η', 'theta': 'θ',
      'iota': 'ι', 'kappa': 'κ', 'lambda': 'λ', 'mu': 'μ',
      'nu': 'ν', 'xi': 'ξ', 'pi': 'π', 'rho': 'ρ',
      'sigma': 'σ', 'tau': 'τ', 'upsilon': 'υ', 'phi': 'φ',
      'chi': 'χ', 'psi': 'ψ', 'omega': 'ω',
      'Gamma': 'Γ', 'Delta': 'Δ', 'Theta': 'Θ', 'Lambda': 'Λ',
      'Xi': 'Ξ', 'Pi': 'Π', 'Sigma': 'Σ', 'Phi': 'Φ',
      'Psi': 'Ψ', 'Omega': 'Ω'
    };

    // Reemplazar símbolos griegos
    Object.entries(greekLetters).forEach(([latex, unicode]) => {
      formatted = formatted.replace(new RegExp(`\\\\${latex}\\b`, 'g'), unicode);
    });

    // Manejar subíndices _{...} o _x
    formatted = formatted.replace(/_\{([^}]+)\}/g, '<sub>$1</sub>');
    formatted = formatted.replace(/_(\w)/g, '<sub>$1</sub>');

    // Manejar superíndices ^{...} o ^x
    formatted = formatted.replace(/\^\{([^}]+)\}/g, '<sup>$1</sup>');
    formatted = formatted.replace(/\^(\w)/g, '<sup>$1</sup>');

    // Flechas
    formatted = formatted.replace(/\\rightarrow/g, '→');
    formatted = formatted.replace(/\\leftarrow/g, '←');
    formatted = formatted.replace(/\\leftrightarrow/g, '↔');
    formatted = formatted.replace(/\\Rightarrow/g, '⇒');
    formatted = formatted.replace(/\\Leftarrow/g, '⇐');

    // Operadores matemáticos
    formatted = formatted.replace(/\\times/g, '×');
    formatted = formatted.replace(/\\div/g, '÷');
    formatted = formatted.replace(/\\pm/g, '±');
    formatted = formatted.replace(/\\mp/g, '∓');
    formatted = formatted.replace(/\\cdot/g, '·');
    formatted = formatted.replace(/\\neq/g, '≠');
    formatted = formatted.replace(/\\leq/g, '≤');
    formatted = formatted.replace(/\\geq/g, '≥');
    formatted = formatted.replace(/\\approx/g, '≈');
    formatted = formatted.replace(/\\equiv/g, '≡');
    formatted = formatted.replace(/\\propto/g, '∝');
    formatted = formatted.replace(/\\infty/g, '∞');
    formatted = formatted.replace(/\\partial/g, '∂');
    formatted = formatted.replace(/\\nabla/g, '∇');

    // Fracciones simples \frac{a}{b}
    formatted = formatted.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, 
      '<span style="display:inline-block;vertical-align:middle"><span style="display:block;text-align:center;border-bottom:1px solid;padding:0 2px">$1</span><span style="display:block;text-align:center;padding:0 2px">$2</span></span>');

    // Paréntesis y llaves
    formatted = formatted.replace(/\\left\(/g, '(');
    formatted = formatted.replace(/\\right\)/g, ')');
    formatted = formatted.replace(/\\left\[/g, '[');
    formatted = formatted.replace(/\\right\]/g, ']');
    formatted = formatted.replace(/\\left\{/g, '{');
    formatted = formatted.replace(/\\right\}/g, '}');

    // Funciones matemáticas
    formatted = formatted.replace(/\\text\{([^}]+)\}/g, '<span style="font-style:normal">$1</span>');
    formatted = formatted.replace(/\\mathrm\{([^}]+)\}/g, '<span style="font-style:normal">$1</span>');

    // Limpiar backslashes restantes de comandos no procesados
    formatted = formatted.replace(/\\/g, '');

    return formatted;
  };

  return <>{processText(text)}</>;
}