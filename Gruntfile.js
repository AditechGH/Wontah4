module.exports = function(grunt) {
    //grunt wrapper function
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        //grunt task configuration will go here
        ngAnnotate: {
            options: {
                singleQuotes: true
            },
            app: {
                files: {
                    './client/custom/scripts/main.min.js': ['./client/custom/scripts/main.js']
                }
            }
        },
        concat: {
            js: { //target
                src: ['./client/custom/scripts/main.min.js'],
                dest: './client/custom/scripts/main.min.js'
            }
        },
        uglify: {
            js: { //target
                src: ['./client/custom/scripts/main.min.js'],
                dest: './client/custom/scripts/main.min.js'
            }
        }
    });

    //load grunt tasks
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-ng-annotate');

    //register grunt default task
    grunt.registerTask('default', ['ngAnnotate', 'concat', 'uglify']);
};