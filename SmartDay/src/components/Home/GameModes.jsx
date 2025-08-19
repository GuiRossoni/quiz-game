import { ImInfinite } from 'react-icons/im'
import { BiTimeFive } from 'react-icons/bi'
import { TbDeviceGamepad2 } from 'react-icons/tb'

const gameModes = [
	{
		icon: <TbDeviceGamepad2 className='text-3xl' />,
		title: 'Clássico',
		description: 'Complete as perguntas sem errar para ganhar! Você tem curingas que podem te ajudar'
	},
	{
		icon: <BiTimeFive className='text-3xl' />,
		title: 'Tempo',
		description: 'Complete as perguntas dentro do limite de tempo para ganhar! Você pode usar curingas'
	},
	{
		icon: <ImInfinite className='text-3xl' />,
		title: 'Infinito',
		description: 'Supere seu recorde completando o maior número de perguntas possível! Você pode usar curingas'
	}
]

export default function GameModes () {
	return (
		<section className='lg:max-w-6xl mx-auto lg:col-start-1 lg:col-end-2 px-8 py-6 flex flex-col justify-center bg-[url("/bg-gamemodes.svg")] text-slate-900 w-full'>
			<h2 className='text-2xl mb-4 font-medium '>Modos de Jogo</h2>
			<nav>
				<ul className='flex flex-col sm:flex-row justify-center gap-5'>
					{gameModes.map((mode, index) => (
						<li key={index + mode.title} className='bg-neutral-300 max-w-sm md:max-w-none bg-opacity-30 backdrop-blur-[2px] rounded p-5 hover:scale-[1.03] transition-all hover:backdrop-blur-0 hover:bg-opacity-100 hover:bg-white shadow-sm mx-auto'>
							{mode.icon}
							<h3 className='text-xl font-medium my-1'>{mode.title}</h3>
							<p className='text-sm'>{mode.description}</p>
						</li>
					))}
				</ul>
			</nav>
		</section>
	)
}
