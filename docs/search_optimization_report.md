# Search Optimization Report — Elasticsearch Integration

## Overview
Campus Connect integrates Elasticsearch for optimized full-text search on forum questions, replacing basic MongoDB regex queries with relevance-scored, fuzzy-matching, highlighted search results.

## Architecture

```
Search Request → Search Controller → Elasticsearch Available?
                                        ↓ YES                    ↓ NO
                                   ES Full-Text Search      MongoDB $text Search
                                        ↓                        ↓
                                   Fetch Full Docs from MongoDB
                                        ↓
                                   Return Ranked Results
```

### Graceful Fallback
If Elasticsearch is unavailable (not running, not configured), the search automatically falls back to MongoDB's built-in `$text` search using the text index on `{ heading, desc, tags }`.

## Elasticsearch Configuration

### Index: `campus_connect_questions`

**Settings:**
- Shards: 1 (single-node setup)
- Replicas: 0
- Custom analyzer with `standard` tokenizer + `lowercase`, `stop`, `snowball` filters

**Mappings:**
| Field | Type | Boost | Description |
|-------|------|-------|-------------|
| `heading` | text (custom_analyzer) | 2.0x | Question title — higher relevance weight |
| `desc` | text (custom_analyzer) | 1.0x | Question description |
| `tags` | keyword | — | Exact match filtering |
| `asker` | keyword | — | Filter by asking user |
| `instituteId` | keyword | — | Institute-scoped search |
| `createdAt` | date | — | Date sorting |
| `votes` | integer | — | Vote-based sorting |
| `views` | integer | — | View-based sorting |

### Search Features
1. **Multi-match query** across heading, desc, and tags with field boosting
2. **Fuzzy matching** (`fuzziness: 'AUTO'`) tolerates typos
3. **Result highlighting** — matched terms wrapped in `<em>` tags
4. **Filtering** by institute, tags
5. **Sorting** by relevance, date, votes, or views
6. **Pagination** with offset-based pagination

## API Endpoints

### `GET /api/search/questions`
Full-text search for forum questions.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `q` | string | — | Search query text |
| `tags` | string | — | Comma-separated tag filter |
| `sort` | string | `newest` | Sort: `newest`, `votes`, `views`, `oldest` |
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Results per page |

**Example:**
```
GET /api/search/questions?q=javascript closures&tags=programming&sort=votes&page=1
```

**Response:**
```json
{
  "source": "elasticsearch",
  "total": 42,
  "page": 1,
  "limit": 20,
  "questions": [
    {
      "_id": "...",
      "heading": "How do JavaScript closures work?",
      "desc": "I need to understand...",
      "_searchScore": 8.5,
      "_highlights": {
        "heading": ["How do <em>JavaScript</em> <em>closures</em> work?"]
      }
    }
  ]
}
```

### `GET /api/search/users`
Search users by name.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `q` | string | — | Name search (min 2 chars) |
| `role` | string | — | Filter: `student` or `faculty` |
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Results per page |

## Data Synchronization
- **New questions** are automatically indexed in ES when created via `askQuestion` controller
- **Bulk sync** is available via `bulkIndexQuestions()` for initial data import
- **Deletions** are synced via `deleteQuestion()` function

## Performance Comparison

| Feature | MongoDB $text | Elasticsearch |
|---------|--------------|---------------|
| Fuzzy matching | ❌ No | ✅ Yes |
| Field boosting | ❌ No | ✅ Yes (heading 2x) |
| Highlighting | ❌ No | ✅ Yes |
| Custom analyzers | ❌ No | ✅ Yes (snowball, stop words) |
| Relevance scoring | Basic | Advanced (BM25) |
| Typo tolerance | ❌ No | ✅ Yes |

## Implementation Files
- `backend/config/elasticClient.js` — ES client, index management, search/index functions
- `backend/controllers/searchController.js` — Search endpoints with ES/MongoDB fallback
- `backend/routes/searchRoutes.js` — Route definitions
