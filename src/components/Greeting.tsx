import React from 'react';

interface GreetingProps {
  message: string;
}

export function Greeting({ message }: GreetingProps) {
  return (
    <div className="text-white text-center">
      <h1 className="text-6xl tracking-tight">
        {message}
      </h1>
    </div>
  );
}
