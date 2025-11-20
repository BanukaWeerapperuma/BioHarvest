import React, { createContext, useState } from 'react'

export const RatingContext = createContext({
  ratings: {},
  updateRating: (foodId, rating, reviewCount) => {}
})

const RatingProvider = ({ children }) => {
  const [ratings, setRatings] = useState({})

  const updateRating = (foodId, rating, reviewCount) => {
    setRatings(prev => ({ ...prev, [foodId]: { rating, reviewCount } }))
  }

  return (
    <RatingContext.Provider value={{ ratings, updateRating }}>
      {children}
    </RatingContext.Provider>
  )
}

export default RatingProvider
