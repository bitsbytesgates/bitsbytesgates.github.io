# -*- coding: utf-8 -*- #
# frozen_string_literal: true

module Rouge
    module Lexers
        class PSS < RegexLexer
            title "Portable Test and Stimulus"
            desc "The Accellera Portable Test and Stimulus language (https://www.accellera.org/downloads/standards/portable-stimulus)"
            tag 'pss'
            filenames '*.pss'
            mimetypes 'text/x-pss'

            keywords = %w(
                activity array as assert
                bind bins body break
                chandle compile
                constraint continue covergroup coverpoint cross declaration
                default disable do dynamic else enum
                exec export extend file forall
                foreach function has header if iff
                ignore_bins illegal_bins import in init init_down
                init_up inout input instance join_branch
                join_first join_none join_select lock
                match output override package parallel
                pool post_solve pre_solve 
                repeat replicate 
                return run_end run_start schedule select sequence
                share solve static
                super symbol target 
                type typedef unique while with
            )

            declarations = %w(
                abstract const private protected public pure
                rand ref static
            )

            typekind = %w(
                action buffer class component resource state stream struct
            )

            types = %w(bit bool int list map set string void)


            id = /[[:alpha:]_][[:word:]]*/

            state :root do
                rule %r/[^\S\n]+/, Text
                rule %r(//.*?$), Comment::Single
                rule %r(/\*.*?\*/)m, Comment::Multiline

                # Give keywords priority
                rule %r/(?:#{keywords.join('|')})\b/, Keyword

                rule %r/(?:#{declarations.join('|')})\b/, Keyword::Declaration
                rule %r/(?:#{types.join('|')})\b/, Keyword::Type
                rule %r/(?:true|false|null)\b/, Keyword::Constant
                rule %r/(?:#{typekind.join('|')})\b/, Keyword::Declaration, :type
                rule %r/"""\s*\n.*?(?<!\\)"""/m, Str::Heredoc
                rule %r/"(\\\\|\\"|[^"])*"/, Str
                rule %r/(#{id})(::)/m do
                    groups Name::Namespace, Punctuation
                end
                rule %r/#{id}:/, Name::Label
                rule %r/\$?#{id}/, Name
                rule %r/[\[\](){}:;,]/, Punctuation
                rule %r/[~^*!%&<>\|+=.\/?-]/, Operator

                digit = /[0-9]_+[0-9]|[0-9]/
                bin_digit = /[01]_+[01]|[01]/
                oct_digit = /[0-7]_+[0-7]|[0-7]/
                hex_digit = /[0-9a-f]_+[0-9a-f]|[0-9a-f]/i
                rule %r/#{digit}+\.#{digit}+([eE]#{digit}+)?[fd]?/, Num::Float
                rule %r/0b#{bin_digit}+/i, Num::Bin
                rule %r/0x#{hex_digit}+/i, Num::Hex
                rule %r/0#{oct_digit}+/, Num::Oct
                rule %r/#{digit}+L?/, Num::Integer
                rule %r/\n/, Text
            end

            state :type do
                rule %r/\s+/m, Text
                rule id, Name::Class, :pop!
            end
        end
    end
end
