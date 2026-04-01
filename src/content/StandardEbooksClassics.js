/**
 * StandardEbooksClassics.js
 * Hardcoded list of 5 Year 2 classic books sourced from Standard Ebooks.
 * Standard Ebooks (https://standardebooks.org) provides free, high-quality,
 * carefully formatted public-domain ebooks.
 *
 * Each entry includes:
 *   id       – unique identifier used as the localStorage bookmark key suffix
 *   title    – display title
 *   author   – display author name
 *   emoji    – decorative emoji for the card
 *   coverColor – hex accent colour for the cover placeholder
 *   url      – canonical Standard Ebooks book page (used for the integration test)
 *   epubUrl  – direct URL to the EPUB file (used by the in-app reader)
 */
export const STANDARD_EBOOKS_CLASSICS = [
  {
    id: 'peter-and-wendy',
    title: 'Peter and Wendy',
    author: 'J. M. Barrie',
    emoji: '🧚',
    coverColor: '#5BAD8F',
    url: 'https://standardebooks.org/ebooks/j-m-barrie/peter-and-wendy',
    epubUrl:
      'https://standardebooks.org/ebooks/j-m-barrie/peter-and-wendy/downloads/j-m-barrie_peter-and-wendy.epub',
  },
  {
    id: 'secret-garden',
    title: 'The Secret Garden',
    author: 'Frances Hodgson Burnett',
    emoji: '🌷',
    coverColor: '#8B5CF6',
    url: 'https://standardebooks.org/ebooks/frances-hodgson-burnett/the-secret-garden',
    epubUrl:
      'https://standardebooks.org/ebooks/frances-hodgson-burnett/the-secret-garden/downloads/frances-hodgson-burnett_the-secret-garden.epub',
  },
  {
    id: 'aesops-fables',
    title: "Aesop's Fables",
    author: 'Aesop, translated by V. S. Vernon Jones',
    emoji: '🦊',
    coverColor: '#F59E0B',
    url: 'https://standardebooks.org/ebooks/aesop/fables/v-s-vernon-jones',
    epubUrl:
      'https://standardebooks.org/ebooks/aesop/fables/v-s-vernon-jones/downloads/aesop_fables_v-s-vernon-jones.epub',
  },
  {
    id: 'alice-wonderland',
    title: "Alice's Adventures in Wonderland",
    author: 'Lewis Carroll',
    emoji: '🐇',
    coverColor: '#3D4F8B',
    url: 'https://standardebooks.org/ebooks/lewis-carroll/alices-adventures-in-wonderland/john-tenniel',
    epubUrl:
      'https://standardebooks.org/ebooks/lewis-carroll/alices-adventures-in-wonderland/john-tenniel/downloads/lewis-carroll_alices-adventures-in-wonderland_john-tenniel.epub',
  },
  {
    id: 'wizard-of-oz',
    title: 'The Wonderful Wizard of Oz',
    author: 'L. Frank Baum',
    emoji: '🌪️',
    coverColor: '#10B981',
    url: 'https://standardebooks.org/ebooks/l-frank-baum/the-wonderful-wizard-of-oz',
    epubUrl:
      'https://standardebooks.org/ebooks/l-frank-baum/the-wonderful-wizard-of-oz/downloads/l-frank-baum_the-wonderful-wizard-of-oz.epub',
  },
  {
    id: 'jungle-book',
    title: 'The Jungle Book',
    author: 'Rudyard Kipling',
    emoji: '🐯',
    coverColor: '#65A30D',
    url: 'https://standardebooks.org/ebooks/rudyard-kipling/the-jungle-book',
    epubUrl:
      'https://standardebooks.org/ebooks/rudyard-kipling/the-jungle-book/downloads/rudyard-kipling_the-jungle-book.epub',
  },
  {
    id: 'black-beauty',
    title: 'Black Beauty',
    author: 'Anna Sewell',
    emoji: '🐴',
    coverColor: '#1C1917',
    url: 'https://standardebooks.org/ebooks/anna-sewell/black-beauty',
    epubUrl:
      'https://standardebooks.org/ebooks/anna-sewell/black-beauty/downloads/anna-sewell_black-beauty.epub',
  },
  {
    id: 'treasure-island',
    title: 'Treasure Island',
    author: 'Robert Louis Stevenson',
    emoji: '🏴‍☠️',
    coverColor: '#B45309',
    url: 'https://standardebooks.org/ebooks/robert-louis-stevenson/treasure-island',
    epubUrl:
      'https://standardebooks.org/ebooks/robert-louis-stevenson/treasure-island/downloads/robert-louis-stevenson_treasure-island.epub',
  },
]
