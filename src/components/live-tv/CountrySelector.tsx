import React from 'react';
import type { TvCountry } from '../../modules/live-tv/types';

interface CountrySelectorProps {
  countries: TvCountry[];
  selectedCountry: string;
  onSelectCountry: (countryCode: string) => void;
  scope?: string;
}

export const CountrySelector: React.FC<CountrySelectorProps> = ({
  countries,
  selectedCountry,
  onSelectCountry,
  scope = 'livetv'
}) => {
  return (
    <div className="w-full flex items-center space-x-2 overflow-x-auto py-1 scroll-smooth select-none">
      <span className="text-[11px] uppercase font-extrabold text-brand-muted shrink-0 mr-1 tracking-wider">
        Country:
      </span>
      {countries.map((country) => {
        const isSelected = selectedCountry === country.code;
        return (
          <button
            key={country.code}
            id={`country-pill-${country.code}`}
            data-tv-nav="true"
            data-tv-scope={scope}
            onClick={() => onSelectCountry(country.code)}
            className={`tv-focus-target px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center space-x-1.5 shrink-0 ${
              isSelected
                ? 'bg-brand-accent text-white shadow-cinema-glow ring-2 ring-white/30'
                : 'bg-brand-card text-brand-muted hover:text-white hover:bg-white/10 border border-brand-border'
            }`}
          >
            <span>{country.flag}</span>
            <span>{country.name}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              isSelected ? 'bg-black/30 text-white' : 'bg-white/10 text-gray-400'
            }`}>
              {country.channelCount}
            </span>
          </button>
        );
      })}
    </div>
  );
};
