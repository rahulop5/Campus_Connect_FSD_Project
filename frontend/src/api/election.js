import api from './axios';

export const removeCandidate = (candidateId) => {
  return api.delete(`/election/nominate/${candidateId}`);
};
