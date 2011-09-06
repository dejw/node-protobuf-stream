
test:
	@protoc test/test.proto -o test/test.desc
	@nodeunit test/*.js

clean:
	@rm -f test/test.desc

.PHONY: test