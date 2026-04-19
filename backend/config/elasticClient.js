import { Client } from '@elastic/elasticsearch';

let esClient = null;
let isESConnected = false;

const QUESTIONS_INDEX = 'campus_connect_questions';

/**
 * Initialize Elasticsearch connection with graceful fallback.
 * If ES is unavailable, the app falls back to MongoDB text search.
 */
const initElasticsearch = async () => {
  try {
    esClient = new Client({
      node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
      maxRetries: 3,
      requestTimeout: 5000,
    });

    // Test connection
    const health = await esClient.cluster.health();
    isESConnected = true;
    console.log(`[Elasticsearch] Connected. Cluster status: ${health.status}`);

    // Create index if it doesn't exist
    await ensureIndex();
  } catch (error) {
    isESConnected = false;
    console.warn('[Elasticsearch] Connection failed. Falling back to MongoDB text search.');
    console.warn('[Elasticsearch] Error:', error.message);
  }
};

/**
 * Create the questions index with proper mappings
 */
const ensureIndex = async () => {
  try {
    const exists = await esClient.indices.exists({ index: QUESTIONS_INDEX });
    if (!exists) {
      await esClient.indices.create({
        index: QUESTIONS_INDEX,
        body: {
          settings: {
            number_of_shards: 1,
            number_of_replicas: 0,
            analysis: {
              analyzer: {
                custom_analyzer: {
                  type: 'custom',
                  tokenizer: 'standard',
                  filter: ['lowercase', 'stop', 'snowball']
                }
              }
            }
          },
          mappings: {
            properties: {
              heading: { type: 'text', analyzer: 'custom_analyzer', boost: 2.0 },
              desc: { type: 'text', analyzer: 'custom_analyzer' },
              tags: { type: 'keyword' },
              asker: { type: 'keyword' },
              instituteId: { type: 'keyword' },
              createdAt: { type: 'date' },
              votes: { type: 'integer' },
              views: { type: 'integer' },
              wealth: { type: 'integer' },
              answersCount: { type: 'integer' }
            }
          }
        }
      });
      console.log(`[Elasticsearch] Index '${QUESTIONS_INDEX}' created.`);
    }
  } catch (error) {
    console.warn('[Elasticsearch] Index creation error:', error.message);
  }
};

/**
 * Index a question document in Elasticsearch
 */
export const indexQuestion = async (question) => {
  if (!isESConnected || !esClient) return;
  try {
    await esClient.index({
      index: QUESTIONS_INDEX,
      id: question._id.toString(),
      body: {
        heading: question.heading,
        desc: question.desc,
        tags: question.tags || [],
        asker: question.asker?.toString(),
        instituteId: question.instituteId?.toString(),
        createdAt: question.createdAt,
        votes: question.votes || 0,
        views: question.views || 0,
        wealth: question.wealth || 0,
        answersCount: question.answers?.length || 0
      }
    });
  } catch (error) {
    console.warn('[Elasticsearch] Indexing error:', error.message);
  }
};

/**
 * Search questions using Elasticsearch
 * @param {string} query - Search query
 * @param {Object} filters - Optional filters { tags, instituteId, sort }
 * @returns {Array} - Search results with scores
 */
export const searchQuestions = async (query, filters = {}) => {
  if (!isESConnected || !esClient) return null; // Return null to signal fallback
  try {
    const must = [];
    const filter = [];

    if (query) {
      must.push({
        multi_match: {
          query,
          fields: ['heading^2', 'desc', 'tags'],
          type: 'best_fields',
          fuzziness: 'AUTO'
        }
      });
    }

    if (filters.instituteId) {
      filter.push({ term: { instituteId: filters.instituteId } });
    }

    if (filters.tags && filters.tags.length > 0) {
      filter.push({ terms: { tags: filters.tags } });
    }

    const sortConfig = [];
    switch (filters.sort) {
      case 'votes':
        sortConfig.push({ votes: 'desc' });
        break;
      case 'views':
        sortConfig.push({ views: 'desc' });
        break;
      case 'oldest':
        sortConfig.push({ createdAt: 'asc' });
        break;
      default:
        sortConfig.push({ createdAt: 'desc' }); // newest first
    }

    const result = await esClient.search({
      index: QUESTIONS_INDEX,
      body: {
        query: {
          bool: {
            must: must.length > 0 ? must : [{ match_all: {} }],
            filter
          }
        },
        sort: sortConfig,
        size: filters.limit || 20,
        from: filters.offset || 0,
        highlight: {
          fields: {
            heading: {},
            desc: { fragment_size: 150 }
          }
        }
      }
    });

    return {
      total: result.hits.total.value,
      results: result.hits.hits.map(hit => ({
        _id: hit._id,
        score: hit._score,
        ...hit._source,
        highlights: hit.highlight || {}
      }))
    };
  } catch (error) {
    console.warn('[Elasticsearch] Search error:', error.message);
    return null; // Signal fallback to MongoDB
  }
};

/**
 * Bulk index all questions (useful for initial sync)
 */
export const bulkIndexQuestions = async (questions) => {
  if (!isESConnected || !esClient || questions.length === 0) return;
  try {
    const body = questions.flatMap(q => [
      { index: { _index: QUESTIONS_INDEX, _id: q._id.toString() } },
      {
        heading: q.heading,
        desc: q.desc,
        tags: q.tags || [],
        asker: q.asker?.toString(),
        instituteId: q.instituteId?.toString(),
        createdAt: q.createdAt,
        votes: q.votes || 0,
        views: q.views || 0,
        wealth: q.wealth || 0,
        answersCount: q.answers?.length || 0
      }
    ]);

    const result = await esClient.bulk({ body, refresh: true });
    console.log(`[Elasticsearch] Bulk indexed ${questions.length} questions. Errors: ${result.errors}`);
  } catch (error) {
    console.warn('[Elasticsearch] Bulk index error:', error.message);
  }
};

/**
 * Delete a question from the index
 */
export const deleteQuestion = async (questionId) => {
  if (!isESConnected || !esClient) return;
  try {
    await esClient.delete({ index: QUESTIONS_INDEX, id: questionId.toString() });
  } catch (error) {
    console.warn('[Elasticsearch] Delete error:', error.message);
  }
};

/**
 * Check if Elasticsearch is connected
 */
export const isConnected = () => isESConnected;

// Initialize on import
initElasticsearch();

export default { indexQuestion, searchQuestions, bulkIndexQuestions, deleteQuestion, isConnected };
