import { describe, expect, it } from 'vitest'
import { stripJekyllPreamble } from '../../scripts/bootstrap-mock-content'

describe('stripJekyllPreamble()', () => {
  it('removes Jekyll YAML frontmatter', () => {
    const input = `---
layout: default
title: Bill's Story
---

Body text here.
Another line.
`
    expect(stripJekyllPreamble(input)).toBe(`Body text here.\nAnother line.`)
  })

  it('removes {{ liquid }} expressions', () => {
    const input = `Visit {{ site.url }}{{ site.baseurl }}/about.`
    expect(stripJekyllPreamble(input)).toBe(`Visit /about.`)
  })

  it('removes {% liquid %} tags (include, for, etc.)', () => {
    const input = `{% include header.html %}
Chapter body.
{% for item in site.pages %}{{ item.title }}{% endfor %}
`
    expect(stripJekyllPreamble(input)).toBe(`Chapter body.`)
  })

  it('handles files with no frontmatter and no liquid (passthrough)', () => {
    const input = `Just plain text.\nSecond line.`
    expect(stripJekyllPreamble(input)).toBe(`Just plain text.\nSecond line.`)
  })
})
