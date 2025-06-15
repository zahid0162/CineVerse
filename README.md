# CineVerse - React Native Movie App

A modern, feature-rich movie discovery app built with React Native and Expo, powered by The Movie Database (TMDB) API.

## 🎬 Features

### Core Functionality
- **Browse Movies/TV Shows**: Discover popular, now playing, top rated, and upcoming movies
- **Search**: Search movies by title with real-time results
- **Genre Filtering**: Browse movies by specific genres
- **Movie/TV Show Details**: Comprehensive movie information including cast, crew, trailers, and production details
- **Watchlist**: Save movies to your personal watchlist with local storage
- **User Profile**: Track your movie preferences and watchlist statistics

### Modern UI/UX
- **Dark Theme**: Sleek Netflix-inspired dark interface
- **Responsive Design**: Optimized for different screen sizes
- **Smooth Animations**: Fluid transitions and loading states
- **Pull-to-Refresh**: Refresh content with pull gesture
- **Infinite Scrolling**: Load more content seamlessly

### Navigation
- **Bottom Tabs**: Easy navigation between main sections
- **Drawer Navigation**: Additional navigation options
- **Deep Linking**: Direct links to movie details

## 🏗 Architecture

### Project Structure
```
app/
├── (tabs)/               # Tab-based screens
│   ├── home.tsx         # Home screen with featured content
│   ├── search.tsx       # Search and genre filtering
│   ├── watchlist.tsx    # Saved movies
│   ├── profile.tsx      # User profile and settings
│   └── _layout.tsx      # Tab navigation layout
├── components/          # Reusable UI components
│   ├── MovieCard.tsx    # Movie poster card component
│   └── LoadingSpinner.tsx # Loading indicator
├── services/           # API and data services
│   └── movieApi.ts     # TMDB API integration
├── types/              # TypeScript type definitions
│   └── movie.ts        # Movie-related interfaces
├── movie/              # Movie detail screens
│   └── [id].tsx        # Dynamic movie details screen
├── _layout.tsx         # Root layout with drawer
└── index.tsx          # App entry point
```

### Design Patterns
- **Clean Architecture**: Separation of concerns with services, components, and screens
- **TypeScript**: Full type safety throughout the application
- **Component Composition**: Reusable, modular components
- **State Management**: React hooks for local state management
- **Error Handling**: Comprehensive error handling with user feedback

### Data Management
- **API Integration**: RESTful API calls with Axios
- **Real-time Updates**: Live search and data synchronization

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator or Android Emulator (for testing)

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```
4. Run on your preferred platform:
   ```bash
   npm run ios     # iOS Simulator
   npm run android # Android Emulator
   npm run web     # Web browser
   ```

## 🔧 Technologies Used

### Core
- **React Native** - Cross-platform mobile development
- **Expo** - Development platform and tooling
- **TypeScript** - Type-safe JavaScript
- **Expo Router** - File-based navigation

### UI/UX
- **Expo Image** - Optimized image loading
- **Expo Linear Gradient** - Beautiful gradient effects
- **Ionicons** - Comprehensive icon library
- **React Native Gesture Handler** - Touch gesture handling

### Navigation
- **React Navigation** - Navigation library
- **Bottom Tabs** - Tab-based navigation
- **Drawer Navigation** - Side menu navigation
- **Stack Navigation** - Screen transitions

### Data & Storage
- **Axios** - HTTP client for API calls
- **AsyncStorage** - Local data persistence
- **TMDB API** - Movie database service

### Development
- **ESLint** - Code linting and quality
- **Prettier** - Code formatting
- **Git** - Version control

## 🎨 Design System

### Color Palette
- **Primary**: Netflix Red (#e50914)
- **Background**: Pure Black (#000)
- **Surface**: Dark Gray (#1a1a1a)
- **Text Primary**: White (#fff)
- **Text Secondary**: Light Gray (#ccc)
- **Text Tertiary**: Medium Gray (#666)

### Typography
- **Headers**: Bold, high contrast
- **Body Text**: Medium weight, readable
- **Captions**: Light weight, subtle

### Components
- **Cards**: Rounded corners, subtle shadows
- **Buttons**: High contrast, clear actions
- **Icons**: Consistent sizing, meaningful
- **Loading States**: Smooth animations

## 📱 API Integration

### The Movie Database (TMDB)
- **Endpoint**: `https://api.themoviedb.org/3`
- **Features Used**:
  - Popular Movies/TV Shows
  - Now Playing Movies/TV Shows
  - Top Rated Movies/TV Shows
  - Upcoming Movies/TV Shows
  - Movie/TV Shows Search
  - Movie/TV Shows Details
  - Movie/TV Shows Credits
  - Movie/TV Shows Videos
  - Genre List
  - Discover Movies/TV Shows by Genre

### API Key
The app uses a demo API key for TMDB. In production, you should:
1. Get your own API key from [TMDB](https://www.themoviedb.org/settings/api)
2. Replace the API key in `app/services/movieApi.ts`
3. Use environment variables for security

## 🔜 Future Enhancements

### Planned Features
- **User Authentication**: Login and personalized recommendations
- **Social Features**: Share movies, reviews, and ratings
- **Offline Mode**: Download movies for offline viewing
- **Advanced Filters**: Filter by year, rating, runtime, etc.
- **Recommendations**: AI-powered movie suggestions
- **TV Shows**: Expand to include TV series
- **Trailers**: In-app video playback
- **Push Notifications**: New releases and personalized alerts

### Technical Improvements
- **State Management**: Redux Toolkit for complex state
- **Testing**: Unit and integration tests
- **Performance**: Image caching and lazy loading optimizations
- **Accessibility**: Screen reader support and accessibility features
- **Internationalization**: Multi-language support
- **CI/CD**: Automated testing and deployment

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **The Movie Database (TMDB)** for providing the comprehensive movie API
- **Expo Team** for the excellent development platform
- **React Native Community** for the amazing ecosystem
- **Netflix** for design inspiration

## 📞 Support

For support, email zaidmuneer25@gmail.com or create an issue in the repository.

---

**Built with ❤️ for movie enthusiasts**
