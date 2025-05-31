#let doc(
  it,
) = {
  show heading: it => {
    if it.level == 1 {
      set block(spacing: 1em)
      set par(justify: true, leading: 2em)
      set align(center)
      set text(size: 20pt)
    } else if it.level == 2 {
      set block(spacing: 1.2em)
      set text(size: 17pt)
    } else if it.level == 3 {
      set block(spacing: 1.5em)
      set text(size: 14pt)
    } else if it.level == 4 {
      set block(spacing: 1.5em)
      set text(size: 12pt)
    }
    it
  }
  it
}
