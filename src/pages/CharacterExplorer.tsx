import React, { useState, useEffect, createContext, useContext, useMemo, useRef } from 'react';
import axios from 'axios';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { User, Shield, Zap } from 'lucide-react';

const SelectionContext = createContext<{
  selectedIds: number[];
  toggleSelection: (id: number) => void;
}>({ selectedIds: [], toggleSelection: () => { } });

const CharacterCard = React.memo(({ character }: { character: any }) => {
  const { selectedIds, toggleSelection } = useContext(SelectionContext);
  const isSelected = selectedIds.includes(character.id);
  
  const start = performance.now();
  while (performance.now() - start < 5) {
  }

  console.log(`Rendering CharacterCard: ${character.name}`);

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
  const [characters, setCharacters] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchCharacters = async () => {
    try {
      const response = await axios.get(`https://rickandmortyapi.com/api/character?page=${page}`);
      setCharacters(prev => [...prev, ...response.data.results]);
      setPage(p => p + 1);
    } catch (error) {
      console.error('Failed to fetch characters', error);
    }
  };

  const [isFetching, setIsFetching] = useInfiniteScroll(fetchCharacters, containerRef);

  useEffect(() => {
    fetchCharacters();
  }, []);

  const toggleSelection = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const contextValue = { selectedIds, toggleSelection };

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
          {characters.map((char, index) => (
            <CharacterCard key={`${char.id}-${index}`} character={char} />
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
