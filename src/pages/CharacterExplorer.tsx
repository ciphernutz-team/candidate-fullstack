import React, { useState, useEffect, useRef, useCallback, useMemo, createContext, useContext } from 'react';
import axios from 'axios';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';

interface Character {
  id: number;
  name: string;
  image: string;
  status: string;
  species: string;
}

// Only the (stable) toggle handler travels through context. selectedIds stays in
// the parent and each card receives its own `isSelected` boolean as a prop, so
// selecting one card re-renders only that card instead of every card on the page.
const SelectionContext = createContext<{ toggleSelection: (id: number) => void }>({
  toggleSelection: () => { },
});

const CharacterCard = React.memo(({ character, isSelected }: { character: Character; isSelected: boolean }) => {
  const { toggleSelection } = useContext(SelectionContext);

  return (
    <div
      onClick={() => toggleSelection(character.id)}
      className={`p-4 rounded-xl border transition-all cursor-pointer ${
        isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:border-blue-200'
      }`}
    >
      <img src={character.image} alt={character.name} className="w-full h-40 object-cover rounded-lg mb-4" />
      <h3 className="font-bold text-slate-900 truncate">{character.name}</h3>
      <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
        <span className={`w-2 h-2 rounded-full ${character.status === 'Alive' ? 'bg-green-500' : 'bg-red-500'}`}></span>
        {character.species} — {character.status}
      </div>
    </div>
  );
});

const CharacterExplorer = () => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Track the next page + whether more pages exist in refs, so fetchCharacters
  // never reads a stale `page` from a closure. (The previous version closed over
  // page === 1 and refetched page 1 on every scroll, appending duplicates.)
  const pageRef = useRef(1);
  const hasMoreRef = useRef(true);

  const fetchCharacters = useCallback(async () => {
    if (!hasMoreRef.current) return;
    const page = pageRef.current;
    pageRef.current = page + 1; // claim this page synchronously to dedupe concurrent calls
    try {
      const response = await axios.get(`https://rickandmortyapi.com/api/character?page=${page}`);
      setCharacters(prev => [...prev, ...response.data.results]);
      if (!response.data.info?.next) hasMoreRef.current = false;
    } catch (error) {
      pageRef.current = page; // roll back so this page is retried next time
      console.error('Failed to fetch characters', error);
    }
  }, []);

  const [isFetching] = useInfiniteScroll(fetchCharacters, containerRef);

  useEffect(() => {
    fetchCharacters();
  }, [fetchCharacters]);

  const toggleSelection = useCallback((id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }, []);

  const contextValue = useMemo(() => ({ toggleSelection }), [toggleSelection]);

  return (
    <SelectionContext.Provider value={contextValue}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Entity Explorer</h1>
            <p className="text-slate-500">Multiversal data management</p>
          </div>
          <div className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold">
            Selected: {selectedIds.length}
          </div>
        </div>

        <div
          ref={containerRef}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 h-[calc(100vh-250px)] overflow-y-auto p-2"
        >
          {characters.map((char) => (
            <CharacterCard key={char.id} character={char} isSelected={selectedIds.includes(char.id)} />
          ))}
          {isFetching && (
            <div className="col-span-full py-8 text-center text-slate-400">
              Loading more entities...
            </div>
          )}
        </div>
      </div>
    </SelectionContext.Provider>
  );
};

export default CharacterExplorer;
