import * as htmlparser from "htmlparser2";
import axios, { AxiosResponse } from "axios";
import { Dict } from "./utils";

interface Link {
  loc: string;
  type: string;
}

interface Keyword {
  word: string;
  count: number;
}

class KeywordCounter {
  keywords: Dict<number>;

  constructor() {
    this.keywords = {};
  }
  addWord(word: string) {
    const stopwords = [
      "a",
      "about",
      "above",
      "after",
      "again",
      "against",
      "all",
      "am",
      "an",
      "and",
      "any",
      "are",
      "as",
      "at",
      "be",
      "because",
      "been",
      "before",
      "being",
      "below",
      "between",
      "both",
      "but",
      "by",
      "could",
      "did",
      "do",
      "does",
      "doing",
      "down",
      "during",
      "each",
      "few",
      "for",
      "from",
      "further",
      "had",
      "has",
      "have",
      "having",
      "he",
      "her",
      "here",
      "hers",
      "herself",
      "him",
      "himself",
      "his",
      "how",
      "I",
      "if",
      "in",
      "into",
      "is",
      "it",
      "its",
      "itself",
      "let’s",
      "me",
      "more",
      "most",
      "my",
      "myself",
      "nor",
      "of",
      "on",
      "once",
      "only",
      "or",
      "other",
      "ought",
      "our",
      "ours",
      "ourselves",
      "out",
      "over",
      "own",
      "same",
      "she",
      "should",
      "so",
      "some",
      "such",
      "than",
      "that",
      "the",
      "their",
      "theirs",
      "them",
      "themselves",
      "then",
      "there",
      "these",
      "they",
      "this",
      "those",
      "through",
      "to",
      "too",
      "under",
      "until",
      "up",
      "very",
      "was",
      "we",
      "were",
      "what",
      "when",
      "where",
      "which",
      "while",
      "who",
      "whom",
      "why",
      "with",
      "would",
      "you",
      "your",
      "yours",
      "yourself",
      "yourselves"
    ];
    if (["", "s", "d", "re", "ve", "ll", ...stopwords].includes(word)) {
      return;
    }
    const normalizedWord = word.toLowerCase();
    if (this.keywords[normalizedWord]) {
      this.keywords[normalizedWord] += 1;
    } else {
      this.keywords[normalizedWord] = 1;
    }
  }
  getSortedArray() {
    const array = [];
    const keys = Object.keys(this.keywords);
    for (const key of keys) {
      array.push({ word: key, count: this.keywords[key] });
    }
    return array.sort((a, b) => a.count - b.count).reverse();
  }
}

async function extractKeywords(
  response: AxiosResponse<any>
): Promise<Keyword[]> {
  const pageData = response.data;
  const keywordCounter = new KeywordCounter();

  let insideBody = false;

  const parser = new htmlparser.Parser(
    {
      onopentag: function(name: string) {
        if (name === "body") {
          insideBody = true;
        }
      },
      onclosetag: function(name: string) {
        if (name === "body") {
          insideBody = false;
        }
      },
      ontext: function(text) {
        const split = text.split(/\W/);
        split.forEach(word => {
          if (insideBody) {
            keywordCounter.addWord(word);
          }
        });
      }
    },
    { decodeEntities: true }
  );

  parser.write(pageData);
  return keywordCounter.getSortedArray();
}

async function extractLinks(response: AxiosResponse<any>): Promise<Link[]> {
  const pageData = response.data;
  const links: Link[] = [];

  const parser = new htmlparser.Parser(
    {
      onopentag: function(name, attribs) {
        if (name === "a") {
          let link = attribs.href;
          if (!link) {
            return;
          }

          if (link.startsWith("http")) {
            links.push({
              loc: link,
              type: "absolute"
            });
          } else {
            if (link.startsWith("./")) {
              link = link.slice(2);
            }
            if (link.startsWith("/")) {
              link = link.slice(1);
            }
            link = `${response.config.url}/${link}`;
            links.push({
              loc: link,
              type: "relative"
            });
          }
        }
      }
    },
    { decodeEntities: true }
  );

  parser.write(pageData);
  return links;
}

export async function extractInfo(
  url: string
): Promise<{ keywords: Keyword[]; links: Link[] }> {
  console.log(`fetching: ${url}`);
  const response = await axios.get(url);
  const keywords = extractKeywords(response);
  const links = extractLinks(response);

  const info = await Promise.all([keywords, links]);

  return { keywords: info[0], links: info[1] };
}
