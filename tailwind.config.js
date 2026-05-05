export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Cinzel', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif']
      },
      colors: {
        ink: '#0B0F14',
        slatepanel: '#111820',
        lacquer: '#1A1214',
        ember: '#8B2C2C',
        blood: '#8B2C2C',
        gold: '#C9A24E',
        jade: '#67c6a3',
        parchment: '#EFE5CF'
      },
      boxShadow: {
        glow: '0 18px 48px rgba(0, 0, 0, 0.32), 0 0 26px rgba(201, 162, 78, 0.08)',
        gold: '0 0 22px rgba(201, 162, 78, 0.32)'
      }
    }
  },
  plugins: []
};
