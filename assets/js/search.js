async function initSearch() {
    const response = await fetch("/search.json");
    const documents = await response.json();

    const idx = lunr(function () {
      this.field('title', { boost: 10 });
      this.field('content');
      this.ref('url');

      documents.forEach(doc => this.add(doc));
    });

    const searchBox = document.getElementById("search-box");
    const resultsList = document.getElementById("search-results");

    searchBox.addEventListener("input", function () {
      const query = this.value.trim();
      resultsList.innerHTML = "";

      if (query.length < 2) return;

      // Search for exact match first, then wildcard for partial matches
      let results = idx.search(query);
      if (results.length === 0) {
        // If no exact matches, try wildcard
        results = idx.search(query + "*");
      }

      results.forEach(result => {
        const doc = documents.find(d => d.url === result.ref);
        const li = document.createElement("li");
        
        // Find the search term in content and get context
        const content = doc.content;
        const queryLower = query.toLowerCase();
        const index = content.toLowerCase().indexOf(queryLower);
        
        let excerpt = "";
        if (index !== -1) {
          // Split content into words
          const words = content.split(/\s+/);
          let charCount = 0;
          let startWord = 0;
          
          // Find which word contains the search term
          for (let i = 0; i < words.length; i++) {
            if (charCount + words[i].length >= index) {
              startWord = Math.max(0, i - 20);
              break;
            }
            charCount += words[i].length + 1;
          }
          
          // Get 20 words before and after
          const endWord = Math.min(words.length, startWord + 40);
          excerpt = words.slice(startWord, endWord).join(" ");
          
          // Highlight the search term (any partial match)
          const regex = new RegExp(`(\\b\\w*${query}\\w*\\b)`, 'gi');
          excerpt = excerpt.replace(regex, '<mark>$1</mark>');
        } else {
          excerpt = content.substring(0, 150).trim() + "...";
        }
        
        li.innerHTML = `
          <a href="${doc.url}">${doc.title}</a>
          <p>${excerpt}...</p>
        `;
        resultsList.appendChild(li);
      });
    });
  }

  initSearch();
