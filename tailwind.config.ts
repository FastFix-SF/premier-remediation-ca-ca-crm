
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: {
				DEFAULT: '1rem',
				sm: '2rem',
				lg: '4rem',
				xl: '5rem',
				'2xl': '6rem',
			},
			screens: {
				sm: '640px',
				md: '768px',
				lg: '1024px',
				xl: '1280px',
				'2xl': '1400px'
			}
		},
		extend: {
			screens: {
				xs: '360px',
				sm: '475px',
			},
			fontFamily: {
				sans: ['Inter', 'Arial', 'system-ui', 'sans-serif'],
				display: ['Playfair Display', 'Arial', 'Inter', 'system-ui', 'serif'],
				arial: ['Arial', 'system-ui', 'sans-serif'],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'pulse-cta': {
					'0%, 100%': {
						opacity: '1',
						boxShadow: '0 0 0 0 hsl(var(--accent) / 0.7)'
					},
					'50%': {
						opacity: '0.9',
						boxShadow: '0 0 0 10px hsl(var(--accent) / 0)'
					}
				},
				'float-gentle': {
					'0%, 100%': {
						transform: 'translateY(0px)'
					},
					'50%': {
						transform: 'translateY(-3px)'
					}
				},
				'wiggle-phone': {
					'0%, 90%, 100%': {
						transform: 'rotate(0deg)'
					},
					'92%, 96%': {
						transform: 'rotate(-5deg)'
					},
					'94%, 98%': {
						transform: 'rotate(5deg)'
					}
				},
				'glow': {
					'0%, 100%': {
						boxShadow: '0 0 20px hsl(var(--accent) / 0.3)'
					},
					'50%': {
						boxShadow: '0 0 30px hsl(var(--accent) / 0.6)'
					}
				},
				'shine': {
					'0%': {
						backgroundPosition: '-200% center'
					},
					'100%': {
						backgroundPosition: '200% center'
					}
				},
				'text-glow': {
					'0%, 100%': {
						textShadow: '0 0 10px hsl(var(--accent) / 0.5)'
					},
					'50%': {
						textShadow: '0 0 20px hsl(var(--accent) / 0.8), 0 0 30px hsl(var(--accent) / 0.6)'
					}
				},
				'best-bounce': {
					'0%, 100%': {
						transform: 'translateY(0px) scale(1)'
					},
					'50%': {
						transform: 'translateY(-5px) scale(1.05)'
					}
				},
				'flash': {
					'0%': {
						opacity: '1',
						transform: 'scale(1)',
						filter: 'brightness(1)',
						boxShadow: '0 0 0 rgba(255, 255, 255, 0)'
					},
					'10%': {
						opacity: '1',
						transform: 'scale(1.2)',
						filter: 'brightness(3)',
						boxShadow: '0 0 20px rgba(255, 255, 255, 0.8)'
					},
					'30%': {
						opacity: '0.9',
						transform: 'scale(1.1)',
						filter: 'brightness(2)',
						boxShadow: '0 0 10px rgba(255, 255, 255, 0.4)'
					},
					'100%': {
						opacity: '1',
						transform: 'scale(1)',
						filter: 'brightness(1)',
						boxShadow: '0 0 0 rgba(255, 255, 255, 0)'
					}
				},
				'solar-flow': {
					'0%': {
						backgroundPosition: '0 0'
					},
					'100%': {
						backgroundPosition: '0 -16px'
					}
				},
				'gentle-pulse': {
					'0%, 100%': {
						transform: 'scale(1)',
						boxShadow: '0 0 0 0 hsl(var(--primary) / 0.1)'
					},
					'50%': {
						transform: 'scale(1.02)',
						boxShadow: '0 0 0 3px hsl(var(--primary) / 0)'
					}
				},
				'subtle-bounce': {
					'0%, 100%': {
						transform: 'translateY(0px)'
					},
					'50%': {
						transform: 'translateY(-2px)'
					}
				},
				'soft-float': {
					'0%, 100%': {
						transform: 'translateY(0px)'
					},
					'50%': {
						transform: 'translateY(-1px)'
					}
				},
				'gentle-glow': {
					'0%, 100%': {
						opacity: '1'
					},
					'50%': {
						opacity: '0.85'
					}
				},
				'soft-ripple': {
					'0%': {
						transform: 'scale(1)',
						opacity: '0.6'
					},
					'100%': {
						transform: 'scale(1.03)',
						opacity: '0'
					}
				},
				'elegant-spark': {
					'0%, 100%': {
						transform: 'scale(1)'
					},
					'50%': {
						transform: 'scale(1.03)'
					}
				},
				'fade-up': {
					'0%': {
						opacity: '0',
						transform: 'translateY(8px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'corner-bounce': {
					'0%, 100%': {
						bottom: '1.5rem',
						right: '1.5rem',
						left: 'auto',
						top: 'auto'
					},
					'25%': {
						bottom: '1.5rem',
						right: 'auto',
						left: '1.5rem',
						top: 'auto'
					},
					'50%': {
						bottom: 'auto',
						right: 'auto',
						left: '1.5rem',
						top: '5rem'
					},
					'75%': {
						bottom: 'auto',
						right: '1.5rem',
						left: 'auto',
						top: '5rem'
					}
				},
				'bell-ring': {
					'0%, 100%': {
						transform: 'rotate(0deg)'
					},
					'10%': {
						transform: 'rotate(14deg)'
					},
					'20%': {
						transform: 'rotate(-14deg)'
					},
					'30%': {
						transform: 'rotate(10deg)'
					},
					'40%': {
						transform: 'rotate(-10deg)'
					},
					'50%': {
						transform: 'rotate(6deg)'
					},
					'60%': {
						transform: 'rotate(-6deg)'
					},
					'70%, 100%': {
						transform: 'rotate(0deg)'
					}
				},
				'bell-glow': {
					'0%, 100%': {
						boxShadow: '0 0 0 0 hsl(var(--primary) / 0.4)',
						transform: 'scale(1)'
					},
					'50%': {
						boxShadow: '0 0 16px 6px hsl(var(--primary) / 0.25)',
						transform: 'scale(1.15)'
					}
				},
				'bell-glow-urgent': {
					'0%, 100%': {
						boxShadow: '0 0 0 0 hsl(var(--destructive) / 0.5)',
						transform: 'scale(1)'
					},
					'50%': {
						boxShadow: '0 0 20px 8px hsl(var(--destructive) / 0.3)',
						transform: 'scale(1.2)'
					}
				},
				'notification-bounce': {
					'0%, 100%': {
						transform: 'scale(1) translateY(0)'
					},
					'25%': {
						transform: 'scale(1.2) translateY(-2px)'
					},
					'50%': {
						transform: 'scale(0.9) translateY(1px)'
					},
					'75%': {
						transform: 'scale(1.1) translateY(-1px)'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'pulse-cta': 'pulse-cta 2s ease-in-out infinite',
				'float-gentle': 'float-gentle 3s ease-in-out infinite',
				'wiggle-phone': 'wiggle-phone 4s ease-in-out infinite',
				'glow': 'glow 2s ease-in-out infinite alternate',
				'shine': 'shine 3s ease-in-out infinite',
				'text-glow': 'text-glow 2.5s ease-in-out infinite',
				'best-bounce': 'best-bounce 3s ease-in-out infinite',
				'flash': 'flash 0.3s ease-out',
				'solar-flow': 'solar-flow 3s linear infinite',
				'gentle-pulse': 'gentle-pulse 4s ease-in-out infinite',
				'subtle-bounce': 'subtle-bounce 3s ease-in-out infinite',
				'soft-float': 'soft-float 4s ease-in-out infinite',
				'gentle-glow': 'gentle-glow 3s ease-in-out infinite',
				'soft-ripple': 'soft-ripple 1s ease-out',
				'elegant-spark': 'elegant-spark 2s ease-in-out infinite',
				'fade-up': 'fade-up 0.5s ease-out forwards',
				'corner-bounce': 'corner-bounce 8s ease-in-out infinite',
				'bell-ring': 'bell-ring 1.2s ease-in-out infinite',
				'bell-glow': 'bell-glow 2s ease-in-out infinite',
				'bell-glow-urgent': 'bell-glow-urgent 1.5s ease-in-out infinite',
				'notification-bounce': 'notification-bounce 2s ease-in-out infinite'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
