#!/usr/bin/env python3
"""Assembles Option B "A media luz" from src/ parts into index.html (artifact format).

File order (spec 0.1):
  title + font links (src/00_head.html)
  one <style> block      (src/1*.css, in name order)
  inline boot <script>   (src/20_boot.js)
  markup                 (src/3*.html and src/4*.html, in name order)
  GSAP 3.13.0 + ScrollTrigger from cdnjs
  main <script>          (src/5*.js, concatenated inside one IIFE)
  gl <script>            (src/60_gl.js, builder 2's WebGL engines; see GL_INTERFACE.md)
  legal kit, verbatim    (legal_kit.html)
Then runs wrap.py (if present) to produce page.html for local tests.

Markup parts may use these tokens (expanded here so the parts stay readable):
  {{MAPS}}  Google Maps URL (already HTML-escaped)
  {{IG}}    Instagram URL
  {{NEW}}   visually hidden "(se abre en una pestaña nueva)"
  {{NE}}    inline up-right arrow SVG      {{DN}}  inline down arrow SVG
  {{TEL}}   the phone number, unbreakable
  {{COPY}}  the "Copiar" button for the phone
  {{RESERVA loc [sm]}}  a "Reservar mesa" primary link with data-loc=loc
  {{LAMP extra-classes}}      a #lamp emblem svg
  {{MINI extra-classes}}      a #lamp-mini emblem svg
  {{STATUSLAMP extra-classes}} a #lamp-mini svg wired to the live status
"""
import os, re, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, 'src')

MAPS = 'https://www.google.com/maps/search/?api=1&amp;query=Gallioli+Bistrot+Ronda+del+General+Mitre+220+Barcelona'
IG = 'https://www.instagram.com/galliolibistrot/'
NEW = '<span class="sr">(se abre en una pestaña nueva)</span>'
NE = '<svg class="arr" viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M3 9 9 3M4.5 3H9v4.5"/></svg>'
DN = '<svg class="arr" viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M6 2v8M2.5 6.5 6 10l3.5-3.5"/></svg>'
TEL = '<span class="tel">932&nbsp;22&nbsp;77&nbsp;38</span>'
COPY = '<button type="button" class="copy js-copy" aria-label="Copiar el teléfono 932 22 77 38">Copiar</button>'


def reserva(m):
    args = m.group(1).split()
    loc, extra = args[0], ' '.join(args[1:])
    cls = 'btn-luz js-reserva' + (' ' + extra if extra else '')
    return (f'<a class="{cls}" data-loc="{loc}" href="{MAPS}" target="_blank" rel="noopener">'
            f'Reservar mesa{NE}{NEW}</a>')


def lamp(m):
    extra = (' ' + m.group(1).strip()) if m.group(1).strip() else ''
    return f'<svg class="lamp{extra}" viewBox="0 0 48 60" aria-hidden="true" focusable="false"><use href="#lamp"/></svg>'


def mini(m, status=False):
    extra = (' ' + m.group(1).strip()) if m.group(1).strip() else ''
    attr = ' data-status-lamp' if status else ''
    return (f'<svg class="lamp lamp-mini{extra}"{attr} viewBox="0 0 24 20" aria-hidden="true" focusable="false">'
            f'<use href="#lamp-mini"/></svg>')


def expand(s):
    s = re.sub(r'\{\{RESERVA ([^}]*)\}\}', reserva, s)
    s = re.sub(r'\{\{LAMP([^}]*)\}\}', lamp, s)
    s = re.sub(r'\{\{MINI([^}]*)\}\}', lambda m: mini(m, False), s)
    s = re.sub(r'\{\{STATUSLAMP([^}]*)\}\}', lambda m: mini(m, True), s)
    for k, v in {'MAPS': MAPS, 'IG': IG, 'NEW': NEW, 'NE': NE, 'DN': DN, 'TEL': TEL, 'COPY': COPY}.items():
        s = s.replace('{{' + k + '}}', v)
    left = re.findall(r'\{\{[^}]*\}\}', s)
    if left:
        sys.exit('unexpanded tokens: ' + ', '.join(sorted(set(left))))
    return s


def parts(prefixes, ext):
    names = sorted(n for n in os.listdir(SRC) if n.endswith(ext) and n[:1] in prefixes)
    return [(n, open(os.path.join(SRC, n), encoding='utf-8').read()) for n in names]


def main():
    out = []
    out.append(open(os.path.join(SRC, '00_head.html'), encoding='utf-8').read().strip())
    css = '\n'.join(f'/* ---- {n} ---- */\n' + c.strip() for n, c in parts('1', '.css'))
    out.append('<style>\n' + css + '\n</style>')
    out.append('<script>\n' + open(os.path.join(SRC, '20_boot.js'), encoding='utf-8').read().strip() + '\n</script>')
    for n, c in parts('34', '.html'):
        out.append(f'<!-- ==== {n} ==== -->\n' + expand(c.strip()))
    out.append('<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/gsap.min.js"></script>')
    out.append('<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/ScrollTrigger.min.js"></script>')
    js = '\n'.join(f'/* ---- {n} ---- */\n' + c.strip() for n, c in parts('5', '.js'))
    out.append('<script>\n(() => {\n"use strict";\n' + js + '\n})();\n</script>')
    gl = os.path.join(SRC, '60_gl.js')
    if os.path.exists(gl):
        out.append('<script>\n' + open(gl, encoding='utf-8').read().strip() + '\n</script>')
    out.append(open(os.path.join(HERE, 'legal_kit.html'), encoding='utf-8').read().rstrip('\n'))
    html = '\n'.join(out) + '\n'
    if not html.startswith('<title>'):
        sys.exit('artifact format violated: file must start with <title>')
    for bad in (r'<!doctype', r'<html[\s>]', r'<head[\s>]', r'<body[\s>]'):
        if re.search(bad, html, re.I):
            sys.exit('artifact format violated: ' + bad)
    open(os.path.join(HERE, 'index.html'), 'w', encoding='utf-8').write(html)
    kb = len(html.encode('utf-8')) / 1024
    print(f'index.html written: {kb:.1f} KB')
    wrap = os.path.join(HERE, 'wrap.py')
    if os.path.exists(wrap):
        subprocess.run([sys.executable, wrap], check=True)


if __name__ == '__main__':
    main()
