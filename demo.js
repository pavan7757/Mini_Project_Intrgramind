class InvertedIndex {
  constructor() {
    this.index = {};
    this.docId = 0;
  }

  addDocument(text) {
    this.docId++;
    const words = text.toLowerCase().split(" ");

    words.forEach(word => {
      if (!this.index[word]) {
        this.index[word] = [];
      }
      this.index[word].push(this.docId);
    });

    console.log(`Doc${this.docId} added`);
  }

  search(word) {
    return this.index[word.toLowerCase()] || [];
  }

  printIndex() {
    console.log(this.index);
  }
}

// Usage
const idx = new InvertedIndex();

idx.addDocument("hello world");
idx.addDocument("hello pavan");
idx.addDocument("world of code");

console.log("Initial Index:");
idx.printIndex();

// Search
console.log("Search hello:", idx.search("hello"));
console.log("Search world:", idx.search("world"));

console.log("\nAdding new document: 'hello code'");
idx.addDocument("hello code");

console.log("Updated Index:");
idx.printIndex();

console.log("Search hello:", idx.search("hello"));
console.log("Search code:", idx.search("code"));