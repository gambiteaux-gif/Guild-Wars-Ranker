export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Cinzel', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif']
      },
      colors: {
        ink: '#090706',
        lacquer: '#5b1118',
        ember: '#c2412d',
        gold: '#d5a84c',
        jade: '#67c6a3',
        parchment: '#f3dfb5'
      },
      boxShadow: {
        glow: '0 0 28px rgba(213, 168, 76, 0.18)'
      }
    }
  },
  plugins: []
};
