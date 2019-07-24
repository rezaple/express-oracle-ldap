module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		watch: {
			options: { livereload: true },
			scss: {
				files: ['views/sass/**/*.sass', 'src/sass/**/*.scss'],
				tasks: ['sass', 'postcss'],
				options: {
					interrupt: true
				}
			},
			// pug: {
			// 	files: ['views/dashboard/**/*.pug'],
			// 	tasks: ['pug'],
			// 	options: {
			// 		interrupt: true
			// 	}
			// }
		},
		// pug: {
		// 	compile: {
		// 		options: {
		// 			pretty: true
		// 		},
		// 		files: [{
		// 			src: ['**/*.pug', '!**/_*.pug'],
		// 			dest: "docs/",
		// 			ext: ".html",
		// 			cwd: "views/dashboard/",
		// 			expand: true
		// 		}]
		// 	}
		// },
		sass: {
			dist: {
				options: {
					outputStyle: 'expanded',
					sourceMap: false
				},
				files: [{
					expand: true,
					cwd: 'views/sass/',
					src: ['*.scss'],
					dest: 'public/css/',
					ext: '.css'
				}]
			}
		},
		postcss: {
			options: {
				map: false,
				processors: [
					require('autoprefixer')({browsers: 'last 3 versions'})
				]
			},
			dist: {
				src: ['views/css/*.css']
			}
		}
	});

	// Load the Grunt plugins.
	grunt.loadNpmTasks('grunt-sass');
	grunt.loadNpmTasks('grunt-postcss');
	grunt.loadNpmTasks('grunt-contrib-pug');
	grunt.loadNpmTasks('grunt-contrib-watch');

	// Set task aliases
	grunt.registerTask('default', ['watch']);
	//add pug if you want build pug
	grunt.registerTask('build', ['sass','postcss']);
};
